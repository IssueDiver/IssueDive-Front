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

<!-- const fetchMockIssues = async () => {
  // 실제 API 호출 대신 임시 데이터 반환
  return [
    {
      id: 1,
      title: '테스트 이슈 1',
      description: '예제 설명',
      status: 'OPEN',
      authorId: 1,
      assigneeId: 2,
      labelIds: [1, 2],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // 필요 시 더 추가
  ];
};

const fetchMockUsers = async () => {
  return [
    { id: 1, username: 'tester1', email: 'tester1@example.com' },
    { id: 2, username: 'tester2', email: 'tester2@example.com' },
  ];
};

const fetchMockLabels = async () => {
  return [
    { id: 1, name: 'bug', color: '#ff0000', description: '' },
    { id: 2, name: 'feature', color: '#00ff00', description: '' },
  ];
}; -->
