<!-- <script setup lang="ts">

// --- Mock Data ---
const mockComments: Comment[] = [
  {
    id: 1, issueId: props.issueId, authorId: 1, author: 'jiwoo', parentId: null,
    description: '첫 번째 테스트 댓글입니다. UI가 어떻게 보이나요?',
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    children: [
      {
        id: 3, issueId: props.issueId, authorId: 1, author: 'jiwoo', parentId: 1,
        description: '네, 동의합니다. 타임라인 형태가 마음에 들어요.',
        createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        children: []
      }
    ]
  },
  {
    id: 2, issueId: props.issueId, authorId: 2, author: 'gemini', parentId: null,
    description: 'Tailwind CSS를 적용하니 훨씬 보기 좋아졌네요!',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    children: []
  }
];

</script> -->