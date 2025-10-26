export type JobRequirement = {
  requirement: string;
  must: boolean;
  weight: number;
};

export type JobRecord = {
  id: string;
  title: string;
  description: string;
  requirements: JobRequirement[];
};
