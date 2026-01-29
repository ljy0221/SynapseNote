export const convertToMarkdown = (blockType: string, content: any): string => {
  if (blockType === 'text' || blockType === 'code') {
    if (typeof content === 'string') return content;
    return '';
  }
  return '';
};