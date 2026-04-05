export type Priority = 'Breaking' | 'High' | 'Medium' | 'Low'
export type ColumnSize = 'full' | 'half' | 'quarter'
export type Category =
  | 'Politics'
  | 'Sports'
  | 'Tech'
  | 'Entertainment'
  | 'World'
  | 'Business'
  | 'Science'
  | 'Health'
  | 'Culture'
  | 'Other'

export interface NewsArticle {
  id: string
  title: string
  category: Category
  priority: Priority
  importanceScore: number
  summary: string
  fullArticle: string
  highlights: string[]
  suggestedImageQuery: string
  columnSize: ColumnSize
  imageUrl?: string
  rawInput: string
  processedAt: string
}

export interface GeminiResponse {
  title: string
  category: Category
  priority: Priority
  importanceScore: number
  summary: string
  fullArticle: string
  highlights: string[]
  suggestedImageQuery: string
  columnSize: ColumnSize
}
