interface Project {
    categoryName: string;
    totalAmount: number;
}

interface CategorySummary {
    name: string;
    projects: number;
    earnings: number;
}

export {
    Project, CategorySummary
}