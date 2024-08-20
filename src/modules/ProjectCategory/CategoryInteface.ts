export interface DeleteCategoryResponse {
    id: string;
    categoryName: string;
    image: string;
    bulletPoint: string[];
    requirements: string[];
    // Assuming subCategory is an array of subCategory IDs or objects
    subCategory: any[];
}
