import type { PromptTemplate } from '../prompts'

export type VnPromptContext = {
  /** VD: "Toán lớp 10" */
  subject: string
  topic: string
  /** VD: "bài kiểm tra cuối kì" */
  exam: string
  /** Một câu về điểm cần đạt, VD: "Mình cần được ít nhất 8,63 điểm." */
  goal: string
  when: string
  hours: string
  /** THPT có đề theo cấu trúc mới (nhiều lựa chọn, đúng/sai, trả lời ngắn). */
  upperSecondary: boolean
}

export const VN_PROMPT_FORMULA: { part: string; example: string; why: string }[] = [
  { part: 'Vai trò', example: 'Bạn là giáo viên Sinh học THPT rất kiên nhẫn.', why: 'Quyết định trình độ và giọng văn của câu trả lời.' },
  { part: 'Mục tiêu', example: 'Mình cần được 8,5 điểm bài cuối kì sau 5 ngày nữa.', why: 'Cho AI biết thế nào là "thành công" với bạn.' },
  { part: 'Bối cảnh', example: 'Mình đang yếu phần hô hấp tế bào. Đây là đề cương: …', why: 'Càng cụ thể, câu trả lời càng sát với bạn.' },
  { part: 'Định dạng', example: 'Giải thích trong 5 gạch đầu dòng, rồi hỏi mình 3 câu, từng câu một.', why: 'Kiểm soát độ dài và giữ bạn luôn phải suy nghĩ.' },
]

export const VN_BAD_PROMPT = 'giải thích quang hợp'

export const VN_GOOD_PROMPT =
  'Bạn là giáo viên Sinh học THPT rất kiên nhẫn. Mình cần được 8,5 điểm bài kiểm tra cuối kì sau 5 ngày nữa và đang yếu phần quang hợp. Hãy giải thích pha sáng và pha tối trong 5 gạch đầu dòng, rồi hỏi mình 3 câu, từng câu một. Đợi mình trả lời rồi mới sang câu tiếp.'

export function buildVnPromptTemplates(ctx: VnPromptContext): PromptTemplate[] {
  const { subject, topic, exam, goal, when, hours, upperSecondary } = ctx
  const format = upperSecondary
    ? 'theo cấu trúc đề thường gặp: trắc nghiệm nhiều lựa chọn, đúng/sai, trả lời ngắn (và tự luận nếu môn có)'
    : 'gồm cả trắc nghiệm và tự luận như đề kiểm tra thường gặp'
  return [
    {
      id: 'diagnose',
      title: 'Tìm lỗ hổng kiến thức',
      when: 'Bắt đầu từ đây',
      text: `Bạn là giáo viên ${subject} giàu kinh nghiệm. Mình sắp làm ${exam}, ${when}. ${goal} Hãy hỏi mình 10 câu ngắn bao quát các phần chính của chương trình, từng câu một. Sau khi mình trả lời đủ 10 câu, cho mình biết 3 phần yếu nhất và nên ôn phần nào trước.`,
    },
    {
      id: 'explain',
      title: 'Giải thích dễ hiểu',
      when: 'Khi học phần mới',
      text: `Giải thích ${topic} (môn ${subject}) cho mình như cho một người thông minh nhưng mới học lần đầu. Bắt đầu bằng một ví dụ so sánh đời thường, sau đó là định nghĩa chuẩn theo SGK, rồi một ví dụ có lời giải. Dưới 250 chữ. Cuối cùng hỏi mình một câu để kiểm tra mình đã hiểu chưa.`,
    },
    {
      id: 'quiz',
      title: 'Kiểm tra nhanh',
      when: 'Mỗi buổi ôn',
      text: `Kiểm tra mình về ${topic} để chuẩn bị cho ${exam} môn ${subject}. Hỏi từng câu một và đợi mình trả lời. Trộn các dạng câu hỏi và tăng dần độ khó. Nếu mình sai, gợi ý trước rồi mới đưa đáp án. Tính điểm giúp mình.`,
    },
    {
      id: 'plan',
      title: 'Lập kế hoạch ôn',
      when: 'Khi chia lịch học',
      text: `Lập kế hoạch ôn ${subject} cho mình, ${exam} diễn ra ${when}. ${goal} Mỗi ngày mình học được khoảng ${hours}. Phần mình yếu nhất là ${topic}. Áp dụng tự kiểm tra, lặp lại ngắt quãng và làm đề. Trình bày dạng danh sách việc cần làm theo từng ngày.`,
    },
    {
      id: 'exam',
      title: 'Đề luyện tập',
      when: 'Vài ngày trước khi thi',
      text: `Soạn cho mình một đề luyện ${exam} môn ${subject}, ${format}, có ${topic} và các phần trọng tâm khác. Đừng đưa đáp án cho tới khi mình gõ "chấm bài". Sau đó chấm theo thang điểm 10 và giải thích từng câu sai.`,
    },
    {
      id: 'fix',
      title: 'Sửa lỗi sai',
      when: 'Sau khi làm bài',
      text: `Đây là một câu ${subject} mình làm sai, kèm bài làm của mình: [dán vào đây]. Đừng chỉ đưa đáp án. Hãy tìm đúng bước mình bắt đầu sai, giải thích vì sao sai, rồi cho mình một câu tương tự để làm lại.`,
    },
  ]
}
