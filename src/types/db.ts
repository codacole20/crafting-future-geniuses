
export interface DbUser {
  id: number;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  lang: string | null;
  roles: "student" | "teacher" | "parent" | "admin";
  passions: string[];
  created_at: string;
}

export type DbUserUpdate = Partial<Omit<DbUser, "id" | "email">>;
