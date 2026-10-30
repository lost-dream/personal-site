import type { ProfileContent } from './types';

export const profileContent: ProfileContent = {
  identity: {
    name: '姓名待补充',
    role: '铁路相关专业在校生',
    summary: '以专业学习为轨道，以团队实践和持续复盘推动自己向前。',
    school: '学校信息待补充',
    major: '专业信息待补充',
    grade: '年级信息待补充',
    target: '求职方向待补充',
  },
  stats: [
    { label: '团队项目', value: '待填写' },
    { label: '实践经历', value: '待填写' },
    { label: '证书与荣誉', value: '待填写' },
  ],
  experiences: [
    { period: '时间待补充', title: '学习经历', description: '补充课程、训练和专业方向。' },
    { period: '时间待补充', title: '团队经历', description: '补充职责、行动和协作过程。' },
    { period: '时间待补充', title: '个人成长', description: '补充生活经历和阶段性收获。' },
  ],
  projects: ['项目内容待补充 A', '项目内容待补充 B', '项目内容待补充 C'].map((title, index) => ({
    title,
    period: '时间待补充',
    teamGoal: '团队目标待补充',
    role: '个人角色待补充',
    action: '关键行动待补充',
    result: '结果待补充',
    reflection: '复盘内容待补充',
    aspect: (['wide', 'portrait', 'square'] as const)[index],
  })),
  strengths: [
    { title: '专业学习', evidence: '行为证据待补充', relatedExperience: '关联经历待补充' },
    { title: '稳定执行', evidence: '行为证据待补充', relatedExperience: '关联经历待补充' },
    { title: '团队协作', evidence: '行为证据待补充', relatedExperience: '关联经历待补充' },
    { title: '复盘表达', evidence: '行为证据待补充', relatedExperience: '关联经历待补充' },
  ],
  hobbies: [
    { title: '兴趣一', note: '生活故事待补充', aspect: 'portrait' },
    { title: '兴趣二', note: '生活故事待补充', aspect: 'wide' },
    { title: '兴趣三', note: '生活故事待补充', aspect: 'square' },
  ],
  contacts: [
    { label: '邮箱', value: '资料待补充' },
    { label: '电话', value: '资料待补充' },
    { label: '社交账号', value: '资料待补充' },
  ],
};
