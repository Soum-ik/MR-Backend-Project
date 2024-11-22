interface Project {
    categoryName: string;
    totalAmount: number;
}

interface CategorySummary {
    name: string;
    projects: number;
    Earnings: number;
}

export {
    Project, CategorySummary
}