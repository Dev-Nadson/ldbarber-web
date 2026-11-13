export type PaginatedResponse<T> = {
    data: T[]
    total: number
    page: number
    total_pages: number
}
