import { PostEditor } from '@/components/admin/post-editor';

export default function EditPostPage({ params }: { params: { id: string } }) {
  return <PostEditor mode="edit" postId={params.id} />;
}
