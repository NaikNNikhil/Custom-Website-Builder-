export type UserStatus = "ACTIVE" | "INACTIVE";

export type UserListItem = {
  id: string;
  email: string;
  status: UserStatus;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};
