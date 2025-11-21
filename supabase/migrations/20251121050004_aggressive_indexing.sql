CREATE INDEX idx_folders_user_parent ON public.folders(user_id, parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_prompts_folder_user ON public.prompts(folder_id, user_id) WHERE deleted_at IS NULL;
