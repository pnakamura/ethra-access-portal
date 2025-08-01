-- Add html_content column to relatorios_semanais table
ALTER TABLE public.relatorios_semanais 
ADD COLUMN html_content TEXT;

-- Update RLS policies to allow users to delete their own reports
CREATE POLICY "Users can delete their own reports" 
ON public.relatorios_semanais 
FOR DELETE 
USING (auth.uid() = usuario_id);

-- Allow system to update reports (for storing HTML content)
CREATE POLICY "System can update reports" 
ON public.relatorios_semanais 
FOR UPDATE 
USING (auth.uid() = usuario_id);