import { column, Schema, Table } from "@powersync/react-native";

const users = new Table({
  username: column.text,
  display_name: column.text,
  age: column.integer,
  weight: column.integer,
  height: column.integer,
  fitness_goal: column.text,
  profile_image: column.text,
  bio: column.text,
  active_title: column.text,
  is_premium: column.integer,
  created_at: column.text,
  updated_at: column.text,
});

const goals = new Table({
  user_id: column.text,
  title: column.text,
  description: column.text,
  target_value: column.real,
  current_value: column.real,
  unit: column.text,
  deadline: column.text,
  completed: column.integer,
  created_at: column.text,
  updated_at: column.text,
});

const workout_sessions = new Table(
  {
    user_id: column.text,
    workout_id: column.text,
    completed_at: column.text,
    duration_minutes: column.integer,
    calories: column.integer,
    xp_earned: column.integer,
  },
  { indexes: { user: ["user_id"] } },
);

const health_metrics = new Table(
  {
    user_id: column.text,
    type: column.text,
    value: column.real,
    unit: column.text,
    recorded_at: column.text,
    created_at: column.text,
  },
  { indexes: { user: ["user_id"] } },
);

const notifications = new Table(
  {
    user_id: column.text,
    title: column.text,
    body: column.text,
    type: column.text,
    read: column.integer,
    data: column.text,
    created_at: column.text,
  },
  { indexes: { user: ["user_id"] } },
);

const social_posts = new Table({
  user_id: column.text,
  type: column.text,
  text: column.text,
  media_uri: column.text,
  audience: column.text,
  created_at: column.text,
});

export const AppSchema = new Schema({
  users,
  goals,
  workout_sessions,
  health_metrics,
  notifications,
  social_posts,
});

export type Database = (typeof AppSchema)["types"];
