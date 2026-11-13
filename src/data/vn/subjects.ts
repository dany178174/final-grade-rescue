// Môn học có điểm số theo Chương trình GDPT 2018. Các môn đánh giá bằng nhận xét
// (Giáo dục thể chất, Nghệ thuật/Âm nhạc/Mĩ thuật, Hoạt động trải nghiệm hướng nghiệp,
// Nội dung giáo dục địa phương) không có điểm trung bình nên không nằm ở đây.

import type { Resource } from '../subjects'
import { youtubeSearch } from '../subjects'

export type VnLevel = 'thcs' | 'thpt'

export const VN_GRADES: { grade: number; level: VnLevel }[] = [
  { grade: 6, level: 'thcs' },
  { grade: 7, level: 'thcs' },
  { grade: 8, level: 'thcs' },
  { grade: 9, level: 'thcs' },
  { grade: 10, level: 'thpt' },
  { grade: 11, level: 'thpt' },
  { grade: 12, level: 'thpt' },
]

export const levelOf = (grade: number): VnLevel => (grade >= 10 ? 'thpt' : 'thcs')

export type VnSubject = {
  id: string
  name: string
  emoji: string
  levels: VnLevel[]
  note: string
  topicExample: string
  /** Tài nguyên riêng của môn, bổ sung cho phần chung. */
  extras: Resource[]
  specialPrompt: { title: string; text: string }
}

export function googleSiteSearch(query: string, site: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${query} site:${site}`)}`
}

export function wikiViSearch(query: string): string {
  return `https://vi.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`
}

const phet: Resource = {
  title: 'PhET – mô phỏng tương tác',
  source: 'ĐH Colorado',
  url: 'https://phet.colorado.edu/vi/',
  kind: 'Công cụ',
  note: 'Thí nghiệm ảo có tiếng Việt: kéo thả để thấy hiện tượng vật lí, hóa học diễn ra thế nào.',
}

const vnexpressScience: Resource = {
  title: 'VnExpress Khoa học',
  source: 'VnExpress',
  url: 'https://vnexpress.net/khoa-hoc',
  kind: 'Báo',
  note: 'Tin khoa học viết dễ hiểu, giúp kiến thức trong sách gắn với đời sống.',
}

const lawLibrary: Resource = {
  title: 'Thư viện Pháp luật',
  source: 'thuvienphapluat.vn',
  url: 'https://thuvienphapluat.vn/',
  kind: 'Tra cứu',
  note: 'Tra nguyên văn luật, nghị định để hiểu đúng các khái niệm trong bài.',
}

export const VN_SUBJECTS: VnSubject[] = [
  {
    id: 'van',
    name: 'Ngữ văn',
    emoji: '📖',
    levels: ['thcs', 'thpt'],
    note: 'Đọc hiểu, nghị luận',
    topicExample: 'VD: nghị luận xã hội',
    extras: [
      {
        title: 'Tra tác giả, tác phẩm',
        source: 'Wikipedia tiếng Việt',
        url: 'https://vi.wikipedia.org/',
        kind: 'Tra cứu',
        note: 'Tìm nhanh tiểu sử tác giả, hoàn cảnh sáng tác để mở bài và dẫn chứng.',
      },
    ],
    specialPrompt: {
      title: 'Lập dàn ý nghị luận',
      text: 'Mình đang ôn Ngữ văn, phần {topic}. Hãy cho mình 3 đề bài có khả năng ra thi. Với mỗi đề, đừng viết bài hộ mình: hãy đặt câu hỏi gợi ý để mình tự lập dàn ý (mở bài, các luận điểm, dẫn chứng, kết bài). Sau đó nhận xét dàn ý của mình và chỉ ra chỗ cần sâu hơn.',
    },
  },
  {
    id: 'toan',
    name: 'Toán',
    emoji: '🧮',
    levels: ['thcs', 'thpt'],
    note: 'Đại số, hình học',
    topicExample: 'VD: hàm số bậc hai',
    extras: [
      {
        title: 'Toanmath',
        source: 'toanmath.com',
        url: 'https://toanmath.com/',
        kind: 'Luyện tập',
        note: 'Kho đề kiểm tra, đề thi và chuyên đề Toán có đáp án, sắp theo lớp.',
      },
      {
        title: 'GeoGebra',
        source: 'GeoGebra',
        url: 'https://www.geogebra.org/?lang=vi',
        kind: 'Công cụ',
        note: 'Vẽ đồ thị, hình học trực quan, giao diện tiếng Việt.',
      },
    ],
    specialPrompt: {
      title: 'Kèm giải từng bước',
      text: 'Mình đang luyện {topic} môn Toán. Cho mình từng bài một, từ dễ đến khó. Khi mình trả lời, hãy kiểm tra từng bước. Nếu sai, chỉ ra đúng bước bị sai và gợi ý, đừng giải hộ ngay.',
    },
  },
  {
    id: 'anh',
    name: 'Tiếng Anh',
    emoji: '🇬🇧',
    levels: ['thcs', 'thpt'],
    note: 'Ngữ pháp, từ vựng',
    topicExample: 'VD: câu bị động',
    extras: [
      {
        title: 'Từ điển Cambridge Anh – Việt',
        source: 'Cambridge',
        url: 'https://dictionary.cambridge.org/vi/',
        kind: 'Tra cứu',
        note: 'Nghĩa tiếng Việt, phiên âm và câu ví dụ chuẩn cho từng từ.',
      },
      {
        title: 'Laban Dictionary',
        source: 'Laban',
        url: 'https://dict.laban.vn/',
        kind: 'Tra cứu',
        note: 'Từ điển Anh – Việt quen thuộc, tra nhanh khi làm bài đọc.',
      },
    ],
    specialPrompt: {
      title: 'Giải thích ngữ pháp bằng tiếng Việt',
      text: 'Giải thích {topic} trong tiếng Anh bằng tiếng Việt cho học sinh: công thức, khi nào dùng, 3 câu ví dụ có dịch nghĩa, và những lỗi học sinh hay mắc. Sau đó cho mình 10 câu bài tập, từng câu một, và chữa sau mỗi câu.',
    },
  },
  {
    id: 'gdcd',
    name: 'Giáo dục công dân',
    emoji: '🤝',
    levels: ['thcs'],
    note: 'Đạo đức, pháp luật',
    topicExample: 'VD: quyền trẻ em',
    extras: [lawLibrary],
    specialPrompt: {
      title: 'Xử lí tình huống',
      text: 'Cho mình 5 tình huống thực tế liên quan đến {topic} trong môn Giáo dục công dân. Với mỗi tình huống, hỏi mình nên ứng xử thế nào và vì sao, rồi nhận xét câu trả lời của mình dựa trên bài học.',
    },
  },
  {
    id: 'lsdl',
    name: 'Lịch sử và Địa lí',
    emoji: '🗺️',
    levels: ['thcs'],
    note: 'Phân môn Lịch sử, Địa lí',
    topicExample: 'VD: nhà Lý, khí hậu Việt Nam',
    extras: [
      {
        title: 'Wikipedia tiếng Việt',
        source: 'Wikipedia',
        url: 'https://vi.wikipedia.org/',
        kind: 'Tra cứu',
        note: 'Tra nhanh sự kiện, nhân vật, địa danh khi cần hiểu thêm bối cảnh.',
      },
    ],
    specialPrompt: {
      title: 'Trục thời gian và bản đồ tư duy',
      text: 'Giúp mình ôn {topic} (môn Lịch sử và Địa lí). Lập trục thời gian hoặc sơ đồ các ý chính, mỗi ý một dòng: nguyên nhân, diễn biến, kết quả, ý nghĩa (hoặc vị trí, đặc điểm, ảnh hưởng). Sau đó hỏi mình từng ý để kiểm tra trí nhớ.',
    },
  },
  {
    id: 'khtn',
    name: 'Khoa học tự nhiên',
    emoji: '🔬',
    levels: ['thcs'],
    note: 'Lí, Hóa, Sinh tích hợp',
    topicExample: 'VD: quang hợp',
    extras: [phet, vnexpressScience],
    specialPrompt: {
      title: 'Giải thích quá trình theo từng bước',
      text: 'Giải thích {topic} (môn Khoa học tự nhiên) thành các bước đánh số, như kể một câu chuyện. Sau đó đưa mình bản trống các bước để mình tự điền lại theo trí nhớ, rồi chấm và sửa.',
    },
  },
  {
    id: 'su',
    name: 'Lịch sử',
    emoji: '🏛️',
    levels: ['thpt'],
    note: 'Việt Nam và thế giới',
    topicExample: 'VD: Chiến tranh lạnh',
    extras: [
      {
        title: 'Wikipedia tiếng Việt',
        source: 'Wikipedia',
        url: 'https://vi.wikipedia.org/',
        kind: 'Tra cứu',
        note: 'Tra nhanh sự kiện, nhân vật, mốc thời gian.',
      },
    ],
    specialPrompt: {
      title: 'Chuỗi nguyên nhân – kết quả',
      text: 'Giúp mình ôn {topic} môn Lịch sử. Lập trục thời gian 8 sự kiện quan trọng nhất, mỗi sự kiện ghi nguyên nhân, kết quả và ý nghĩa (mỗi ý một dòng). Sau đó đố mình: nêu một sự kiện và hỏi nguyên nhân, kết quả của nó.',
    },
  },
  {
    id: 'dia',
    name: 'Địa lí',
    emoji: '🌏',
    levels: ['thpt'],
    note: 'Tự nhiên, kinh tế – xã hội',
    topicExample: 'VD: đọc biểu đồ dân số',
    extras: [
      {
        title: 'Số liệu thống kê chính thức',
        source: 'Cục Thống kê',
        url: 'https://www.gso.gov.vn/',
        kind: 'Tra cứu',
        note: 'Số liệu thật về dân số, kinh tế để luyện nhận xét bảng số liệu và biểu đồ.',
      },
    ],
    specialPrompt: {
      title: 'Luyện nhận xét biểu đồ, bảng số liệu',
      text: 'Cho mình một bảng số liệu (có thể giả định) về {topic} môn Địa lí lớp mình đang học. Hỏi mình nên vẽ dạng biểu đồ nào và vì sao, rồi để mình tự viết nhận xét. Chấm nhận xét của mình theo các ý: xu hướng chung, so sánh, số liệu dẫn chứng, giải thích.',
    },
  },
  {
    id: 'ktpl',
    name: 'GD kinh tế và pháp luật',
    emoji: '⚖️',
    levels: ['thpt'],
    note: 'Kinh tế, pháp luật',
    topicExample: 'VD: quyền và nghĩa vụ công dân',
    extras: [lawLibrary],
    specialPrompt: {
      title: 'Tình huống kinh tế – pháp luật',
      text: 'Cho mình 5 tình huống thực tế về {topic} (môn Giáo dục kinh tế và pháp luật). Với mỗi tình huống, hỏi mình: ai đúng, ai sai, căn cứ vào kiến thức nào. Chờ mình trả lời rồi mới giải thích.',
    },
  },
  {
    id: 'ly',
    name: 'Vật lí',
    emoji: '🧲',
    levels: ['thpt'],
    note: 'Cơ, điện, nhiệt, quang',
    topicExample: 'VD: chuyển động ném xiên',
    extras: [
      phet,
      {
        title: 'Thư viện Vật lý',
        source: 'thuvienvatly.com',
        url: 'https://thuvienvatly.com/',
        kind: 'Luyện tập',
        note: 'Đề kiểm tra, bài giảng và tài liệu Vật lí do giáo viên chia sẻ.',
      },
    ],
    specialPrompt: {
      title: 'Phân tích đề trước khi giải',
      text: 'Mình đang ôn {topic} môn Vật lí. Cho mình một bài tập, nhưng trước khi tính, hãy hỏi mình: đề cho gì, cần tìm gì, áp dụng định luật/công thức nào, đổi đơn vị chưa. Sau đó mới để mình giải và kiểm tra kết quả, đơn vị.',
    },
  },
  {
    id: 'hoa',
    name: 'Hóa học',
    emoji: '⚗️',
    levels: ['thpt'],
    note: 'Vô cơ, hữu cơ',
    topicExample: 'VD: cân bằng phương trình',
    extras: [phet, vnexpressScience],
    specialPrompt: {
      title: 'Luyện bài tập tính toán',
      text: 'Cho mình từng bài tập Hóa học về {topic}, giống đề kiểm tra. Bắt mình ghi phương trình phản ứng và đơn vị ở mỗi bước. Nếu mình cân bằng sai hay tính sai số mol, dừng lại ngay và giải thích chỗ sai.',
    },
  },
  {
    id: 'sinh',
    name: 'Sinh học',
    emoji: '🧬',
    levels: ['thpt'],
    note: 'Tế bào, di truyền, tiến hóa',
    topicExample: 'VD: hô hấp tế bào',
    extras: [vnexpressScience],
    specialPrompt: {
      title: 'Giải thích quá trình theo từng bước',
      text: 'Giải thích {topic} môn Sinh học thành các giai đoạn đánh số, như kể một câu chuyện. Sau đó đưa mình bản trống các giai đoạn để mình điền lại theo trí nhớ, rồi chấm và sửa.',
    },
  },
  {
    id: 'congnghe',
    name: 'Công nghệ',
    emoji: '🛠️',
    levels: ['thcs', 'thpt'],
    note: 'Kĩ thuật, nông nghiệp',
    topicExample: 'VD: bản vẽ kĩ thuật',
    extras: [],
    specialPrompt: {
      title: 'Hiểu bằng ví dụ thực tế',
      text: 'Giải thích {topic} môn Công nghệ bằng ví dụ gần gũi trong đời sống hằng ngày. Sau đó hỏi mình 5 câu: vừa trắc nghiệm vừa "vì sao", từng câu một, và chữa ngay sau mỗi câu.',
    },
  },
  {
    id: 'tinhoc',
    name: 'Tin học',
    emoji: '💻',
    levels: ['thcs', 'thpt'],
    note: 'Lập trình, ứng dụng',
    topicExample: 'VD: vòng lặp trong Python',
    extras: [
      {
        title: 'Freetuts',
        source: 'freetuts.net',
        url: 'https://freetuts.net/',
        kind: 'Lời giải',
        note: 'Hướng dẫn lập trình bằng tiếng Việt, có ví dụ chạy được.',
      },
      {
        title: 'VNOI Wiki',
        source: 'VNOI',
        url: 'https://wiki.vnoi.info/',
        kind: 'Tra cứu',
        note: 'Thuật toán giải thích bằng tiếng Việt, rất hợp nếu bạn thích lập trình.',
      },
    ],
    specialPrompt: {
      title: 'Đoán kết quả chương trình',
      text: 'Đố mình về {topic} môn Tin học. Cho mình những đoạn code ngắn và hỏi chương trình in ra gì hoặc lỗi ở đâu, trước khi bạn tiết lộ. Giải thích mỗi đáp án bằng cách chạy tay từng dòng.',
    },
  },
  {
    id: 'qpan',
    name: 'GD quốc phòng và an ninh',
    emoji: '🎖️',
    levels: ['thpt'],
    note: 'Lí thuyết quốc phòng',
    topicExample: 'VD: luật nghĩa vụ quân sự',
    extras: [lawLibrary],
    specialPrompt: {
      title: 'Hỏi nhanh – đáp gọn',
      text: 'Đố mình 15 câu trắc nghiệm về {topic} môn Giáo dục quốc phòng và an ninh, từng câu một. Sau mỗi câu, giải thích ngắn gọn vì sao đáp án đúng.',
    },
  },
  {
    id: 'khac',
    name: 'Môn khác',
    emoji: '✏️',
    levels: ['thcs', 'thpt'],
    note: 'Tự nhập tên môn',
    topicExample: 'VD: chủ đề bạn thấy khó nhất',
    extras: [],
    specialPrompt: {
      title: 'Học như có gia sư',
      text: 'Làm gia sư cho mình về {topic}. Trước tiên hỏi mình 3 câu để biết mình đang hiểu tới đâu. Sau đó dạy các ý quan trọng nhất theo thứ tự, từng ý một, và kiểm tra mình hiểu chưa trước khi sang ý tiếp.',
    },
  },
]

export function getVnSubject(id: string | null): VnSubject | undefined {
  return VN_SUBJECTS.find((s) => s.id === id)
}

export function subjectsFor(grade: number): VnSubject[] {
  const level = levelOf(grade)
  return VN_SUBJECTS.filter((s) => s.levels.includes(level))
}

/** Video platforms with Vietnamese lessons, as searches tuned to the subject and grade. */
export function vnVideoResources(subjectName: string, grade: number): Resource[] {
  const what = `${subjectName} lớp ${grade}`
  return [
    {
      title: `HOCMAI · ${what}`,
      source: 'YouTube',
      url: youtubeSearch(`HOCMAI ${what}`),
      kind: 'Kênh',
      note: 'Bài giảng theo chương trình mới của các thầy cô quen thuộc.',
    },
    {
      title: `VietJack · ${what}`,
      source: 'YouTube',
      url: youtubeSearch(`VietJack ${what}`),
      kind: 'Kênh',
      note: 'Video ngắn chữa bài tập và tóm tắt lí thuyết theo từng bài trong SGK.',
    },
    {
      title: `Tuyensinh247 · ${what}`,
      source: 'YouTube',
      url: youtubeSearch(`Tuyensinh247 ${what}`),
      kind: 'Kênh',
      note: 'Livestream ôn tập, chữa đề kiểm tra giữa kì và cuối kì.',
    },
    {
      title: 'OLM',
      source: 'olm.vn',
      url: 'https://olm.vn/',
      kind: 'Khóa học',
      note: 'Bài giảng và bài luyện tập theo SGK mới, có chấm điểm tự động.',
    },
  ]
}

export function vnReadingResources(level: VnLevel): Resource[] {
  const list: Resource[] = [
    {
      title: 'Hành trang số',
      source: 'NXB Giáo dục Việt Nam',
      url: 'https://hanhtrangso.nxbgd.vn/',
      kind: 'SGK điện tử',
      note: 'Đọc SGK điện tử bộ Kết nối tri thức và Chân trời sáng tạo.',
    },
    {
      title: 'Hoc10',
      source: 'Cánh Diều',
      url: 'https://hoc10.vn/',
      kind: 'SGK điện tử',
      note: 'SGK điện tử và học liệu của bộ sách Cánh Diều.',
    },
    {
      title: 'Loigiaihay',
      source: 'loigiaihay.com',
      url: 'https://loigiaihay.com/',
      kind: 'Lời giải',
      note: 'Lí thuyết tóm tắt và lời giải SGK chi tiết, đủ cả ba bộ sách.',
    },
    {
      title: 'VietJack',
      source: 'vietjack.com',
      url: 'https://vietjack.com/',
      kind: 'Lời giải',
      note: 'Lí thuyết, trắc nghiệm và đề kiểm tra theo từng bài.',
    },
    {
      title: 'Hoc247',
      source: 'hoc247.net',
      url: 'https://hoc247.net/',
      kind: 'Luyện tập',
      note: 'Đề kiểm tra giữa kì, cuối kì có đáp án để tự luyện.',
    },
    {
      title: 'VnExpress Giáo dục',
      source: 'VnExpress',
      url: 'https://vnexpress.net/giao-duc',
      kind: 'Báo',
      note: 'Tin về kì thi, cấu trúc đề và kinh nghiệm học tập.',
    },
  ]
  if (level === 'thcs') {
    list.push({
      title: 'VioEdu',
      source: 'vioedu.vn',
      url: 'https://vioedu.vn/',
      kind: 'Luyện tập',
      note: 'Luyện tập theo bài, có trò chơi và chấm điểm, phù hợp học sinh THCS.',
    })
  }
  return list
}
