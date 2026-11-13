import type { TierId } from '../../lib/grade'
import type { LearningStyle, SchedulePhase } from '../plan'

export const VN_STYLES: Record<LearningStyle, { label: string; emoji: string; tagline: string; description: string }> = {
  video: {
    label: 'Xem video',
    emoji: '🎬',
    tagline: 'Xem & hiểu',
    description: 'Bài giảng tiếng Việt đúng môn, đúng lớp, đúng bài bạn cần.',
  },
  ai: {
    label: 'Học với AI',
    emoji: '🤖',
    tagline: 'Hỏi & luyện',
    description: 'Câu lệnh (prompt) soạn sẵn cho ChatGPT, Claude, Gemini.',
  },
  reading: {
    label: 'Đọc tài liệu',
    emoji: '📚',
    tagline: 'Đọc & ghi nhớ',
    description: 'SGK điện tử, lời giải, đề luyện và báo tiếng Việt.',
  },
}

export const VN_DAY_OPTIONS: { id: string; label: string; sub: string; promptWhen: string }[] = [
  { id: '1', label: 'Ngày mai', sub: 'Chế độ khẩn cấp', promptWhen: 'vào ngày mai' },
  { id: '2-3', label: '2–3 ngày', sub: 'Nước rút', promptWhen: 'sau 2–3 ngày nữa' },
  { id: '4-7', label: '4–7 ngày', sub: 'Một tuần ôn chắc', promptWhen: 'sau khoảng một tuần nữa' },
  { id: '8-14', label: '1–2 tuần', sub: 'Còn nhiều thời gian', promptWhen: 'sau 1–2 tuần nữa' },
  { id: '15+', label: 'Hơn 2 tuần', sub: 'Chuẩn bị từ sớm', promptWhen: 'sau hơn 2 tuần nữa' },
]

export function getVnDay(id: string | null) {
  return VN_DAY_OPTIONS.find((d) => d.id === id)
}

export const VN_TIER_PLANS: Record<
  TierId,
  { mode: string; emoji: string; headline: string; hours: string; hoursForPrompt: string; summary: string; strategy: string[] }
> = {
  secured: {
    mode: 'Về đích',
    emoji: '🏆',
    headline: 'Bạn đã an toàn. Giữ vững phong độ.',
    hours: '30–45 phút/ngày',
    hoursForPrompt: '30–45 phút',
    summary:
      'Mục tiêu đã nằm chắc trong tay, miễn là bạn vẫn làm bài. Ôn nhẹ để không bị bất ngờ, phần thời gian dư hãy dành cho môn đang cần điểm hơn.',
    strategy: [
      'Đọc lướt lại vở ghi và đề cương một lượt.',
      'Làm thử một đề để chắc không có dạng bài lạ.',
      'Kiểm tra lịch thi, phòng thi và đồ dùng cần mang. Vắng thi là rủi ro duy nhất.',
      'Chuyển thời gian dư sang môn bạn đang thiếu điểm nhất.',
    ],
  },
  easy: {
    mode: 'Ổn định',
    emoji: '🌱',
    headline: 'Mục tiêu vừa sức. Chỉ cần đều đặn.',
    hours: '1–1,5 giờ/ngày',
    hoursForPrompt: '1–1,5 giờ',
    summary: 'Điểm cần đạt nằm trong tầm tay. Mỗi ngày ôn một ít hiệu quả hơn nhiều so với thức khuya ôn dồn.',
    strategy: [
      'Liệt kê các bài trong đề cương, đánh dấu: đã chắc, còn mơ hồ, chưa hiểu.',
      'Dành phần lớn thời gian cho các bài "còn mơ hồ" và "chưa hiểu".',
      'Làm thẻ ghi nhớ cho định nghĩa, công thức; ôn 10 phút mỗi ngày.',
      'Bấm giờ làm một đề hoàn chỉnh trước ngày kiểm tra hai hôm.',
    ],
  },
  focus: {
    mode: 'Tập trung',
    emoji: '🎯',
    headline: 'Hoàn toàn làm được, nếu ôn có chiến lược.',
    hours: '2–3 giờ/ngày',
    hoursForPrompt: '2–3 giờ',
    summary: 'Bạn cần điểm cao, nên đọc lại vở thôi là chưa đủ. Tìm nhanh lỗ hổng kiến thức rồi luyện thật nhiều bài.',
    strategy: [
      'Bắt đầu bằng một đề thử để tìm lỗ hổng, đừng bắt đầu bằng đọc lại vở.',
      'Xếp các bài theo: điểm nhiều × mình yếu. Ôn theo đúng thứ tự đó.',
      'Ôn chủ động: gấp sách lại, tự giải thích hoặc tự làm bài từ trí nhớ.',
      'Hỏi thầy cô hoặc bạn học giỏi 2–3 câu cụ thể mà bạn còn vướng.',
      'Làm ít nhất hai đề hoàn chỉnh có bấm giờ trước ngày kiểm tra.',
    ],
  },
  cram: {
    mode: 'Chính xác',
    emoji: '🔥',
    headline: 'Từng 0,25 điểm đều quan trọng.',
    hours: '3–4 giờ/ngày',
    hoursForPrompt: '3–4 giờ',
    summary:
      'Bạn cần điểm gần tuyệt đối, nên lỗi sai do ẩu là kẻ thù lớn nhất. Nắm chắc mọi dạng bài và luyện như đang thi thật.',
    strategy: [
      'Hỏi thầy cô phạm vi kiến thức và cấu trúc đề (trắc nghiệm, đúng/sai, trả lời ngắn, tự luận).',
      'Nắm chắc các dạng chiếm nhiều điểm trước, không bỏ sót bài nào.',
      'Lập sổ lỗi sai: ghi lại mọi câu sai và lí do sai.',
      'Làm đề hoàn chỉnh như thi thật, sau đó xem lại từng câu sai.',
      'Chiến thuật phòng thi: làm câu dễ trước, chừa 10 phút cuối để soát lại.',
    ],
  },
  impossible: {
    mode: 'Gỡ điểm',
    emoji: '🛟',
    headline: 'Mục tiêu này không thể đạt. Đây là cách khôn ngoan nhất.',
    hours: '3–4 giờ/ngày',
    hoursForPrompt: '3–4 giờ',
    summary:
      'Dù được 10 điểm ở các bài còn lại, bạn vẫn chưa chạm mục tiêu. Hãy đặt mục tiêu mới vừa sức và vẫn ôn hết mình: mỗi điểm đều kéo trung bình lên.',
    strategy: [
      'Xem ô "ĐTB cao nhất có thể" ở trên và chọn một mục tiêu mới vừa sức.',
      'Trao đổi với thầy cô về cách cải thiện, ví dụ các bài thường xuyên còn lại.',
      'Nếu đang tính cả năm, nhớ rằng học kì II có hệ số 2: cố gắng kì này rất đáng.',
      'Vẫn ôn hết sức: điểm bài này càng cao, điểm trung bình càng gần mục tiêu.',
      'Đừng nản: một môn chưa đạt mục tiêu không quyết định cả năm học.',
    ],
  },
}

export const VN_STYLE_ACTIONS: Record<LearningStyle, { learn: string; review: string }> = {
  video: {
    learn: 'Xem 2–3 video ngắn về phần yếu nhất ở tốc độ 1,25×. Dừng lại trước mỗi ví dụ để tự làm thử.',
    review: 'Xem lại đúng đoạn video về những câu mình làm sai, rồi tự làm lại không cần xem.',
  },
  ai: {
    learn: 'Dùng câu lệnh "Giải thích dễ hiểu" và "Kiểm tra nhanh" bên dưới cho phần yếu nhất.',
    review: 'Dán những câu làm sai vào câu lệnh "Sửa lỗi sai" và làm lại từng câu.',
  },
  reading: {
    learn: 'Đọc phần lí thuyết trong SGK về phần yếu nhất. Đọc xong mỗi mục, gấp sách và tóm tắt bằng một câu.',
    review: 'Đọc lại các câu tóm tắt của mình và làm phần câu hỏi, bài tập cuối bài.',
  },
}

export const VN_SCHEDULES: Record<string, SchedulePhase[]> = {
  '1': [
    {
      when: 'Giờ thứ 1',
      title: 'Khoanh vùng',
      tasks: [
        'Liệt kê các bài trong đề cương.',
        'Khoanh 3 phần chiếm nhiều điểm nhất mà bạn yếu nhất.',
        'Bỏ qua phần đã thuộc lòng. Không còn thời gian cho nó.',
      ],
    },
    {
      when: 'Giờ thứ 2–3',
      title: 'Học 3 phần trọng tâm',
      tasks: ['{learn}', 'Học xong mỗi phần, tự làm 3–5 câu hỏi không nhìn sách.'],
    },
    {
      when: 'Giờ thứ 4',
      title: 'Luyện dưới áp lực',
      tasks: ['Bấm giờ làm một bộ câu hỏi trộn lẫn các phần.', 'Chấm bài và ghi lại mọi câu sai.'],
    },
    {
      when: 'Tối nay',
      title: 'Chốt kiến thức',
      tasks: [
        '{review}',
        'Viết một trang tóm tắt công thức, ý chính. Tự viết giúp nhớ lâu hơn.',
        'Ngủ đủ 7–8 tiếng. Não ghi nhớ bài học trong lúc bạn ngủ.',
      ],
    },
    {
      when: 'Sáng hôm thi',
      title: 'Khởi động',
      tasks: ['Ăn sáng, uống đủ nước.', 'Đọc lại trang tóm tắt một lần. Không học thêm phần mới.'],
    },
  ],
  '2-3': [
    {
      when: 'Ngày 1',
      title: 'Tìm lỗ hổng và học',
      tasks: [
        'Làm thử một đề hoặc bộ câu hỏi ôn tập mà không xem sách.',
        'Xếp các phần theo: điểm nhiều × mình yếu.',
        '{learn}',
      ],
    },
    {
      when: 'Ngày 2',
      title: 'Luyện tập',
      tasks: ['Làm bài tập trộn lẫn các chương.', 'Ghi sổ lỗi sai cho mọi câu làm sai.', '{review}'],
    },
    {
      when: 'Tối trước hôm thi',
      title: 'Ôn tổng',
      tasks: ['Bấm giờ làm một đề hoàn chỉnh.', 'Xem lại sổ lỗi sai và trang tóm tắt.', 'Ngủ đủ 8 tiếng. Không thức trắng.'],
    },
  ],
  '4-7': [
    {
      when: 'Ngày 1',
      title: 'Kiểm tra đầu vào',
      tasks: [
        'Làm một đề hoàn chỉnh mà không ôn trước.',
        'Xếp các phần theo: điểm nhiều × mình yếu.',
        'Chia mỗi phần yếu vào một ngày cụ thể.',
      ],
    },
    {
      when: 'Ngày 2–4',
      title: 'Học và lấp lỗ hổng',
      tasks: ['Mỗi ngày học 1–2 phần yếu.', '{learn}', 'Cuối mỗi buổi ôn thẻ ghi nhớ 10 phút.'],
    },
    {
      when: 'Ngày 5–6',
      title: 'Luyện đề như thi thật',
      tasks: ['Mỗi ngày bấm giờ làm một đề hoàn chỉnh.', 'Chấm bài, cập nhật sổ lỗi sai, làm lại mọi câu sai.', '{review}'],
    },
    {
      when: 'Tối trước hôm thi',
      title: 'Ôn nhẹ',
      tasks: ['Chỉ xem lại trang tóm tắt và sổ lỗi sai.', 'Chuẩn bị sẵn đồ dùng mang vào phòng thi.', 'Ngủ đủ 8 tiếng.'],
    },
  ],
  '8-14': [
    {
      when: 'Ngày 1–2',
      title: 'Lên bản đồ ôn tập',
      tasks: ['Gom đề cương, đề các năm trước và vở ghi.', 'Làm một đề thử để biết mình đang ở đâu.', 'Lập danh sách các phần và xếp hạng ưu tiên.'],
    },
    {
      when: 'Ngày 3–8',
      title: 'Học theo từng chương',
      tasks: ['Mỗi ngày một chương, chương yếu nhất trước.', '{learn}', 'Làm thẻ ghi nhớ và ôn lại mỗi ngày (lặp lại ngắt quãng).'],
    },
    {
      when: 'Ngày 9–12',
      title: 'Luyện đề tổng hợp',
      tasks: ['Làm câu hỏi trộn lẫn tất cả các chương.', 'Bấm giờ làm hai đề hoàn chỉnh, cách nhau vài ngày.', '{review}'],
    },
    {
      when: '2 ngày cuối',
      title: 'Hoàn thiện',
      tasks: ['Chỉ ôn sổ lỗi sai và thẻ ghi nhớ.', 'Hỏi thầy cô những câu còn vướng.', 'Ngủ đủ cả hai đêm.'],
    },
  ],
  '15+': [
    {
      when: 'Tuần 1',
      title: 'Xây nền',
      tasks: ['Làm một đề thử để đánh giá.', 'Ôn lại các chương đầu trước, vì chương sau xây trên chương trước.', '{learn}'],
    },
    {
      when: 'Tuần 2',
      title: 'Đào sâu',
      tasks: ['Học các chương còn lại, yếu nhất trước.', 'Ôn thẻ ghi nhớ 15 phút mỗi ngày.', 'Cách ngày làm một bộ bài tập tổng hợp.'],
    },
    {
      when: 'Tuần 3',
      title: 'Chế độ thi',
      tasks: ['Làm 2–3 đề hoàn chỉnh có bấm giờ.', '{review}', '2 ngày cuối: ôn nhẹ và ngủ đủ.'],
    },
  ],
}

export const VN_STYLE_TIPS: Record<LearningStyle, { title: string; tips: string[] }> = {
  video: {
    title: 'Học từ video (chứ không chỉ xem)',
    tips: [
      'Xem ở tốc độ 1,25–1,5× và dừng lại thường xuyên. Xem nhanh không sao, lơ đãng mới hỏng.',
      'Trước khi thầy cô giải ví dụ, bấm dừng và tự làm thử.',
      'Xem xong mỗi video, tắt đi và ghi lại những gì còn nhớ.',
      'Sau mỗi video làm 3–5 bài tập. Xem hiểu chưa chắc đã làm được.',
    ],
  },
  ai: {
    title: 'Nguyên tắc học cùng AI',
    tips: [
      'Dán đề cương hoặc nội dung bài học thật vào. AI chỉ giỏi bằng thông tin bạn đưa cho nó.',
      'Yêu cầu hỏi từng câu một để bạn phải tự suy nghĩ.',
      'Bắt AI kiểm tra bạn. Tự trả lời câu hỏi nhớ lâu hơn đọc lời giải.',
      'Đối chiếu công thức, sự kiện với SGK. AI có thể sai mà vẫn rất tự tin.',
    ],
  },
  reading: {
    title: 'Đọc hiệu quả với phương pháp SQ3R',
    tips: [
      'Lướt (Survey): xem tiêu đề, chữ in đậm và phần tóm tắt cuối bài trước.',
      'Đặt câu hỏi (Question): biến mỗi tiêu đề thành một câu hỏi.',
      'Đọc (Read): đọc từng mục để tìm câu trả lời.',
      'Nhắc lại và ôn (Recite, Review): gấp sách, tự trả lời rồi mới mở ra kiểm tra.',
    ],
  },
}

export const VN_HABITS: { emoji: string; title: string; text: string }[] = [
  { emoji: '🧠', title: 'Tự kiểm tra', text: 'Tự hỏi và trả lời thay vì đọc đi đọc lại. Lôi kiến thức ra khỏi trí nhớ là cách giúp nó ở lại.' },
  { emoji: '📅', title: 'Lặp lại ngắt quãng', text: 'Mỗi ngày ôn một ít thay vì dồn một lúc. Ứng dụng thẻ ghi nhớ có thể nhắc lịch ôn giúp bạn.' },
  { emoji: '🔀', title: 'Trộn dạng bài', text: 'Luyện nhiều dạng bài lẫn lộn trong một buổi, giống như đề thi thật.' },
  { emoji: '⏱️', title: '25 phút học, 5 phút nghỉ', text: 'Học tập trung từng khối 25 phút. Để điện thoại ở phòng khác.' },
  { emoji: '😴', title: 'Ngủ đủ giấc', text: 'Ngủ 7–9 tiếng. Thức trắng ôn bài làm bạn mất nhiều điểm hơn là được.' },
]
