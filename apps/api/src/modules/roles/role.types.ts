export type RoleName = "admin" | "customer" | (string & {});

export type RoleRecord = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};
