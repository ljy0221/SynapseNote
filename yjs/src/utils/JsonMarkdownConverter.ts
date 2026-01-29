export const convertToMarkdown = (blockType: string, content: any): string => {
  if (blockType === 'text' || blockType === 'heading' || blockType === 'paragraph') {
    if (typeof content === 'string') return content;

    if (typeof content === 'object' && content?.text) {
      return content.text;
    }
    return '';
  }
  return '';
};