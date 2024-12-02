import { Card, Typography, Image, Empty } from 'antd';
import { FileImageOutlined } from '@ant-design/icons';
import { IAnalysis } from './types';
const { Title, Paragraph } = Typography;

interface AnalysisCardProps {
  analysis?: IAnalysis;
  imageUrl?: string;
  loading?: boolean;
}

const AnalysisCard = (props: AnalysisCardProps) => {
  console.log('props', props);
  const { analysis, imageUrl, loading } = props;
  const { summary, core_critique } = analysis?.content?.analysis || {};

  // 检查是否有有效数据  
  const hasContent = summary || core_critique || imageUrl;

  return (
    <Card
      className="analysis-card"
      bordered={false}
      loading={loading}
    >
      {hasContent ? (
        <>
          {/* 摘要部分 */}
          {summary && (
            <Title
              level={4}
              className="analysis-summary"
              ellipsis={{ rows: 2, expandable: true }}
            >
              {summary}
            </Title>
          )}

          {/* 图片部分 */}
          {imageUrl && (
            <div className="analysis-image-container">
              <Image
                src={imageUrl}
                alt="Analysis Image"
                fallback="/placeholder-image.png"
                placeholder={
                  <div className="image-placeholder">
                    <FileImageOutlined />
                    <span>Loading image...</span>
                  </div>
                }
              />
            </div>
          )}

          {/* 核心评论部分 */}
          {core_critique && (
            <Paragraph
              className="analysis-critique"
              ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
            >
              {core_critique}
            </Paragraph>
          )}
        </>
      ) : (
        <Empty
          description="No analysis data available"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Card>
  );
};

// 添加样式  
const styles = `  
  .analysis-card {  
    border-radius: 8px;  
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);  
  }  

  .analysis-card .analysis-summary {  
    margin-bottom: 16px; 
    text-align: center; 
  }  

  .analysis-card .analysis-image-container {  
    margin: 16px 0;  
    text-align: center;  
  }  

  .analysis-card .ant-image {  
    max-width: 100%;  
  }  

  .analysis-card .ant-image img {  
    max-height: 400px;  
    object-fit: contain;  
    border-radius: 4px;  
  }  

  .analysis-card .image-placeholder {  
    padding: 48px;  
    background: #fafafa;  
    border-radius: 4px;  
    display: flex;  
    flex-direction: column;  
    align-items: center;  
    gap: 8px;  
    color: #999;  
  }  

  .analysis-card .analysis-critique {  
    margin: 16px 0 0;  
    white-space: pre-wrap;  
    line-height: 1.6;  
  }  

  @media (max-width: 768px) {  
    .analysis-card .ant-image img {  
      max-height: 300px;  
    }  
  }  
`;

// 创建样式标签  
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = styles;
  document.head.appendChild(styleElement);
}

export default AnalysisCard;