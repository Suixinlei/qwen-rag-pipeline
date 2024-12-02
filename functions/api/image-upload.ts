import { CORS_HEADERS } from "../utils/constant";

// 生成 UUID v4  
function uuidv4() {
  return crypto.randomUUID();
}

async function generateHash(file) {  
  const buffer = await file.arrayBuffer();  
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);  
  const hashArray = Array.from(new Uint8Array(hashBuffer));  
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');  
  return hashHex;  
}  

// 获取文件扩展名  
function getExtension(contentType) {
  const extensions = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
  };
  return extensions[contentType] || 'jpg';
}

// 计算签名  
async function calculateSignature(stringToSign, secretKey) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(stringToSign);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    messageData
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export const onRequest = async (context) => {
  const { request, env } = context;
  // 处理 CORS  
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // 固定的 OSS 配置  
    const bucket = 'kouka-static-source';
    const region = 'oss-cn-hangzhou';
    const endpoint = `${bucket}.${region}.aliyuncs.com`;

    // 从环境变量获取密钥  
    const accessKeyId = env.OSS_ACCESS_KEY_ID;
    const accessKeySecret = env.OSS_ACCESS_KEY_SECRET;

    // 解析 multipart/form-data  
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      throw new Error('No image file provided');
    }

    // 检查文件类型  
    const contentType = file.type;
    if (!contentType.startsWith('image/')) {
      throw new Error('Invalid file type. Only images are allowed.');
    }

    // 检查文件大小（限制为 5MB）  
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size exceeds limit (5MB)');
    }

    // 生成文件名  
    const extension = getExtension(contentType);

    // 生成 md5
    const md5 = await generateHash(file);

    const objectKey = `images/${md5}.${extension}`;

    // 准备上传所需的信息  
    const date = new Date().toUTCString();
    const resource = `/${bucket}/${objectKey}`;

    // 构建签名字符串  
    const stringToSign = `PUT\n\n${contentType}\n${date}\n${resource}`;

    // 计算签名  
    const signature = await calculateSignature(stringToSign, accessKeySecret);

    // 获取文件内容  
    const arrayBuffer = await file.arrayBuffer();

    // 上传到 OSS  
    const ossResponse = await fetch(`https://${endpoint}/${objectKey}`, {
      method: 'PUT',
      headers: {
        'Date': date,
        'Content-Type': contentType,
        'Authorization': `OSS ${accessKeyId}:${signature}`,
      },
      body: arrayBuffer
    });

    if (!ossResponse.ok) {
      throw new Error(`OSS upload failed: ${await ossResponse.text()}`);
    }

    // 返回上传成功的图片 URL  
    return new Response(JSON.stringify({
      success: true,
      url: `https://${endpoint}/${objectKey}`
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};