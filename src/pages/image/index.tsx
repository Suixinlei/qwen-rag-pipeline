import { useState } from "react";
import {
  Upload,
  Typography,
  Space,
  Alert,
  Layout,
  theme,
  message,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import type { RcFile } from "antd/es/upload/interface";
import AnalysisCard from './analysis-card';
import { IAnalysis } from './types';

const { Dragger } = Upload;
const { Title } = Typography;
const { Content } = Layout;

export default function ImageAnalysisPage() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [analysis, setAnalysis] = useState<IAnalysis>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { token } = theme.useToken();

  const processImage = async (url: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.API_URL}/api/image-process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: url,
        }),
      });

      if (!response.ok) {
        throw new Error("图片处理失败");
      }

      const data = await response.json();
      setAnalysis(data);
      message.success("图片分析完成！");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "处理过程中发生错误";
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    action: `${process.env.API_URL}/api/image-upload`,
    accept: "image/*",
    showUploadList: false,
    onChange(info) {
      const { status } = info.file;

      if (status === "uploading") {
        setLoading(true);
        return;
      }

      if (status === "done") {
        setImageUrl(info.file.response.url);
        processImage(info.file.response.url);
      } else if (status === "error") {
        setLoading(false);
        setError("图片上传失败");
        message.error("图片上传失败");
      }
    },
    beforeUpload: (file: RcFile) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("只能上传图片文件！");
        return false;
      }

      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("图片大小不能超过 5MB！");
        return false;
      }

      return true;
    },
  };

  return (
    <Layout style={{ background: token.colorBgContainer }}>
      <Content style={{ padding: "24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Title level={2} style={{ textAlign: "center" }}>
              图片吐槽生成器
            </Title>

            {
              !imageUrl && (
                <Dragger {...uploadProps} disabled={loading}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    点击或拖拽图片到这里上传
                  </p>
                  <p className="ant-upload-hint">
                    支持单个图片上传，图片大小不超过 5MB
                  </p>
                </Dragger>
              )
            }


            {error && (
              <Alert
                message="错误"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError("")}
              />
            )}



            {imageUrl && (
              <AnalysisCard
                imageUrl={imageUrl}
                analysis={analysis}
                loading={loading}
              />
            )}
          </Space>
        </div>
      </Content>
    </Layout>
  );
}