export type CounterType = {
  code: string;
  data: {
    createdAt: Date;
    description: string;
    downCount: number;
    id: number;
    name: string;
    slug: string;
    termId: number;
    upCount: number;
    updatedAt: Date;
    userId: number;
    workspaceId: number;
    workspaceSlug: string;
  };
};
