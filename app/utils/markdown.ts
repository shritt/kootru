import { marked } from 'marked'

export const renderMarkdown = (content: string): string => {
  return marked.parse(content) as string
}
