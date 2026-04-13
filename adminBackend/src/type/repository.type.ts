/**
 * Base repository interface.
 * - CreateInput defaults to T without id/createdAt
 * - UpdateInput defaults to partial of CreateInput
 */
export interface Repository<
    T,
    CreateInput = Omit<T, "id" | "createdAt">,
    UpdateInput = Partial<CreateInput>
> {
    create(data: CreateInput): Promise<T>;
    getById(id: string): Promise<T>;
    update(id: string, data: UpdateInput): Promise<T>;
    delete(id: string): Promise<T>;
}
