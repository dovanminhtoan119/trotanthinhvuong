// Dữ liệu tĩnh của game: công trình, nghiên cứu, luật, địa điểm, tên, đặc điểm.
// Save chỉ lưu id tham chiếu tới đây, nên chỉnh cân bằng không làm hỏng save.

export const RES = {
  water:    { name: 'Nước sạch', icon: '💧' },
  food:     { name: 'Thực phẩm', icon: '🍚' },
  scrap:    { name: 'Phế liệu',  icon: '⚙️' },
  wood:     { name: 'Tre gỗ',    icon: '🎋' },
  parts:    { name: 'Linh kiện', icon: '🔩' },
  medicine: { name: 'Thuốc',     icon: '💊' },
  memory:   { name: 'Ký Ức',     icon: '📼' },
};

export const SKILLS = {
  build: 'Xây dựng', farm: 'Trồng trọt', med: 'Y thuật', fight: 'Chiến đấu',
  scout: 'Thám hiểm', craft: 'Chế tạo', talk: 'Giao tiếp', study: 'Nghiên cứu',
};

// slots: số người làm; produce: sản lượng / người / ngày ở kỹ năng 5
// power: + phát, - tiêu thụ; heat: nhiệt khi chạy; cooling: giảm nhiệt
export const BUILDINGS = {
  tent: {
    name: 'Lều bạt', art: 'tent', cost: { wood: 8, scrap: 4 }, work: 4, housing: 4,
    desc: 'Chỗ ngủ tạm cho 4 người. Dột khi mưa.',
  },
  container: {
    name: 'Nhà container', art: 'container', cost: { scrap: 25, wood: 8, parts: 2 }, work: 10, housing: 7,
    heat: 1, req: 'container', desc: 'Container hàng hải cắt cửa sổ. 7 chỗ ở, chắc chắn.',
  },
  filter: {
    name: 'Bể lọc cát', art: 'filter', cost: { scrap: 10, wood: 6 }, work: 6, slots: 3,
    produce: { water: 4.5 }, skill: 'craft', desc: 'Lọc nước sông qua cát và than. Không cần điện.',
  },
  fishing: {
    name: 'Chòi cá', art: 'fishing', cost: { wood: 10 }, work: 5, slots: 3,
    produce: { food: 3 }, skill: 'farm', harborBonus: 1.5,
    desc: 'Đánh cá trên sông. Đặt ở Bến Cảng được thêm 50%.',
  },
  woodcut: {
    name: 'Trại đốn tre', art: 'woodcut', cost: { scrap: 6 }, work: 4, slots: 3,
    produce: { wood: 3 }, skill: 'build', desc: 'Chặt tre ven sông.',
  },
  scrapyard: {
    name: 'Bãi phân loại phế liệu', art: 'scrapyard', cost: { wood: 6 }, work: 4, slots: 3,
    produce: { scrap: 3 }, skill: 'build', ashRisk: 2,
    desc: 'Bới đống đổ nát. Người làm dễ hít phải Tro.',
  },
  herbs: {
    name: 'Vườn thảo dược', art: 'herbs', cost: { wood: 6 }, work: 4, slots: 2,
    produce: { medicine: 0.5 }, skill: 'farm', cooling: 1, desc: 'Ngải cứu, rau má, lá lốt. Thuốc chậm nhưng chắc.',
  },
  firepit: {
    name: 'Đống lửa chung', art: 'firepit', cost: { wood: 5 }, work: 2, upkeep: { wood: 1 }, heat: 2,
    mood: 6, max: 1, desc: 'Nơi mọi người ngồi lại mỗi tối. +Tinh thần, tốn 1 Tre gỗ/ngày.',
  },
  medtent: {
    name: 'Lều cứu thương', art: 'medtent', cost: { wood: 8, scrap: 5 }, work: 5, slots: 1, skill: 'med',
    heal: 2, desc: 'Mỗi y tá chăm 2 người bệnh/ngày, dùng Thuốc nếu có.',
  },
  guard: {
    name: 'Trạm gác', art: 'guard', cost: { wood: 10, scrap: 8 }, work: 5, slots: 2, skill: 'fight',
    defense: 3, desc: 'Lính gác chống Bầy Sói và Hình Nhân Tro.',
  },
  treeline: {
    name: 'Vườn cây chắn', art: 'treeline', cost: { wood: 4 }, work: 4, cooling: 6,
    desc: 'Hàng cây che bóng, hút nhiệt. -6 Nhiệt.',
  },
  decoder: {
    name: 'Bàn giải mã', art: 'decoder', cost: { scrap: 8, wood: 4 }, work: 4, slots: 2, skill: 'study',
    research: 1, desc: 'Giải mã Ký Ức thành tri thức. Mỗi người dùng 1 Ký Ức/ngày.',
  },
  workshop: {
    name: 'Xưởng chế tạo', art: 'workshop', cost: { scrap: 20, wood: 10 }, work: 10, slots: 2,
    produce: { parts: 0.8 }, consume: { scrap: 2 }, skill: 'craft', power: -3, heat: 10, req: 'workshop',
    desc: 'Biến phế liệu thành linh kiện. Cần điện, rất nóng.',
  },
  hydro: {
    name: 'Ruộng thủy canh', art: 'hydro', cost: { scrap: 15, wood: 10, parts: 3 }, work: 10, slots: 3,
    produce: { food: 3.6 }, skill: 'farm', power: -3, heat: 5, req: 'hydroponics',
    desc: 'Rau trồng dưới đèn. Năng suất cao, cần điện.',
  },
  clinic: {
    name: 'Trạm xá', art: 'clinic', cost: { scrap: 20, wood: 10, parts: 4 }, work: 10, slots: 2, skill: 'med',
    heal: 3, ashCure: 4, power: -2, heat: 5, req: 'clinic',
    desc: 'Chữa 3 người/y tá và rút Tro khỏi cơ thể. Cần điện.',
  },
  solar: {
    name: 'Pin mặt trời', art: 'solar', cost: { scrap: 10, parts: 4 }, work: 6, power: 5, heat: 2, req: 'solar',
    desc: '+5 điện (mùa mưa còn 60%). Gần như không tỏa nhiệt.',
  },
  turbine_broken: {
    name: 'Tu-bin hỏng', art: 'turbine_broken', special: true,
    desc: 'Tu-bin cũ của trạm bơm, gỉ sét nhưng còn cứu được.',
  },
  turbine: {
    name: 'Tu-bin nước', art: 'turbine', slots: 1, skill: 'craft', power: 14, heat: 20, special: true,
    desc: '+14 điện (mùa mưa +40%) khi có người vận hành. Tỏa rất nhiều nhiệt.',
  },
};

// Sửa tu-bin là "nâng cấp" ô tu-bin hỏng
export const TURBINE_REPAIR = { cost: { parts: 6, scrap: 20 }, work: 12, req: 'turbine_repair' };

export const RESEARCH = {
  workshop:       { name: 'Xưởng chế tạo', cost: 4,  desc: 'Mở Xưởng chế tạo (Linh kiện).' },
  turbine_repair: { name: 'Bản vẽ tu-bin', cost: 8,  desc: 'Cho phép sửa Tu-bin nước của trạm.' },
  hydroponics:    { name: 'Thủy canh',     cost: 8,  desc: 'Mở Ruộng thủy canh.', after: 'turbine_repair' },
  container:      { name: 'Cải tạo container', cost: 8, desc: 'Mở Nhà container (7 chỗ ở).' },
  clinic:         { name: 'Y học cũ',      cost: 10, desc: 'Mở Trạm xá.', after: 'turbine_repair' },
  solar:          { name: 'Pin mặt trời',  cost: 10, desc: 'Mở Pin mặt trời: điện gần như không nhiệt.' },
  ventilation:    { name: 'Kiến trúc thông gió', cost: 12, desc: 'Mọi công trình tỏa ít hơn 25% Nhiệt.', needFlag: 'heat_known' },
};

export const LAWS = {
  long_shift: { name: 'Ca làm kéo dài', desc: '+25% sản lượng. Mỗi người -1 Sức khỏe/ngày, -4 Tinh thần.' },
  curfew:     { name: 'Giờ Tắt Đèn',   desc: '-12 Nhiệt. Công trình dùng điện giảm 30% sản lượng.', needFlag: 'heat_known' },
  ration:     { name: 'Khẩu phần',     desc: 'Mỗi người chỉ ăn 0,75 phần. -5 Tinh thần.' },
  storytelling: { name: 'Đêm kể chuyện', desc: '+1 Hy Vọng/ngày nếu có Đống lửa chung. Tốn thêm 1 Tre gỗ/ngày.' },
  patrol:     { name: 'Tuần tra đêm',  desc: '+4 Phòng thủ, +0,5 Trật Tự/ngày. -2 Tinh thần.' },
  quarantine: { name: 'Cách ly bắt buộc', desc: 'Tro nhiễm không lây, người Tro nhiễm nặng không làm việc. -0,5 Hy Vọng/ngày.' },
  river_funeral: { name: 'Tang lễ trên sông', desc: 'Khi có người chết: +Hy Vọng thay vì mất. Tốn 3 Tre gỗ mỗi đám.' },
};

export const DISTRICTS = {
  pump:   { name: 'Trạm Bơm', plots: 8, desc: 'Trạm chống ngập cũ. Nước sạch và tu-bin.' },
  harbor: { name: 'Bến Cảng', plots: 6, desc: 'Bến ghe cũ. Đánh cá tốt, ngập vào mùa mưa.',
            unlockCost: { scrap: 20, food: 10 }, unlockDays: 3 },
};

// dist: số ngày đi về; loot: [min,max]; danger 0-3
export const LOCATIONS = {
  bamboo:   { name: 'Rừng tre ven sông', dist: 1, danger: 0, art: 'forest', known: true,
              loot: { wood: [10, 18], food: [0, 4] }, desc: 'Tre mọc dày trên nền khu dân cư cũ.' },
  mall:     { name: 'Siêu thị ngập',     dist: 1, danger: 1, art: 'ruins', known: true,
              loot: { scrap: [8, 16], food: [3, 9], parts: [0, 2] }, desc: 'Nước ngập đến thắt lưng. Kệ hàng còn đồ hộp.' },
  school:   { name: 'Trường học phủ rêu', dist: 1, danger: 0, art: 'school', known: true,
              loot: { memory: [2, 4], scrap: [3, 6] }, desc: 'Thư viện trường. Sách mục, nhưng ổ cứng còn đọc được.' },
  gas:      { name: 'Trạm xăng đổ',      dist: 2, danger: 1, art: 'ruins',
              loot: { parts: [2, 5], scrap: [6, 12] }, desc: 'Máy bơm xăng và xe tải bỏ lại.' },
  hospital: { name: 'Bệnh viện quận',    dist: 2, danger: 2, art: 'hospital',
              loot: { medicine: [3, 7], parts: [0, 2], memory: [0, 2] }, desc: 'Bảy tầng, tầng trệt có thứ gì đó đang sống.' },
  floatmarket: { name: 'Chợ nổi cũ',     dist: 1, danger: 1, art: 'market',
              loot: { food: [6, 12], wood: [2, 6] }, desc: 'Xác ghe neo thành dãy. Đôi khi có người buôn.' },
  tower:    { name: 'Tháp truyền hình',  dist: 3, danger: 3, art: 'tower',
              loot: { memory: [4, 8], parts: [3, 6] }, desc: 'Tháp cao nhất thành phố. Tro bám dày như tuyết.' },
  ship:     { name: 'Tàu hàng mắc cạn',  dist: 3, danger: 2, art: 'ship',
              loot: { scrap: [15, 25], parts: [3, 7], food: [0, 6] }, desc: 'Tàu container nghiêng ở cửa sông.' },
};

export const ORIGINS = {
  engineer: { name: 'Kỹ sư đê điều', desc: '+4 Linh kiện. Xây nhanh hơn 15%.', bonus: { parts: 4 } },
  doctor:   { name: 'Thầy thuốc làng', desc: '+5 Thuốc. Chữa bệnh hiệu quả hơn 30%.', bonus: { medicine: 5 } },
  soldier:  { name: 'Cựu lính Lữ Đoàn', desc: '+4 Phòng thủ thường trực. Biết bắn súng.', bonus: { scrap: 5 } },
  merchant: { name: 'Con của chợ nổi', desc: '+15 Thực phẩm. Giá trao đổi tốt hơn.', bonus: { food: 15 } },
};

export const STORYTELLERS = {
  grandma: { name: 'Bà Ngoại', desc: 'Nhẹ nhàng. Ít tai họa, nhiều ngày yên ổn.', threat: 0.6 },
  ferry:   { name: 'Người Đưa Đò', desc: 'Cân bằng. Trải nghiệm như thiết kế.', threat: 1 },
  ash:     { name: 'Tro', desc: 'Tàn nhẫn. Ironman: chỉ một ô lưu, không quay lại.', threat: 1.4, ironman: true },
};

export const TRAITS = {
  brave:     { name: 'Can đảm', desc: '+2 khi kiểm tra Chiến đấu/Thám hiểm.' },
  glutton:   { name: 'Tham ăn', desc: 'Ăn 1,5 phần.' },
  nostalgic: { name: 'Hoài cổ', desc: 'Vui khi có điện. Buồn khi Giờ Tắt Đèn.' },
  mystic:    { name: 'Mộ đạo', desc: 'Thấy Tro là điều thiêng liêng.' },
  storyteller: { name: 'Người kể chuyện', desc: 'Đống lửa chung có thêm +2 Tinh thần cho mọi người.' },
  light_sleeper: { name: 'Ngủ nông', desc: '-5 Tinh thần khi không có nhà ở.' },
  tough:     { name: 'Rắn rỏi', desc: 'Hồi sức khỏe nhanh, chịu Tro tốt hơn.' },
  lazy:      { name: 'Lười', desc: 'Làm việc kém hơn 20%.' },
  hardworker:{ name: 'Chăm chỉ', desc: 'Làm việc tốt hơn 15%.' },
  optimist:  { name: 'Lạc quan', desc: '+6 Tinh thần.' },
  gloomy:    { name: 'U uất', desc: '-6 Tinh thần.' },
};

export const NAMES = {
  m: ['Thơ', 'Hậu', 'Bảo', 'Tín', 'Lộc', 'Phát', 'Sang', 'Tài', 'Nghĩa', 'Quang', 'Hưng', 'Dũng', 'Lâm', 'Sơn', 'Toàn', 'Vinh', 'Đức', 'Hiếu', 'Kiệt', 'Nhân'],
  f: ['Hạnh', 'Lan', 'Mai', 'Thảo', 'Ngân', 'Vy', 'Trang', 'Hồng', 'Nhung', 'Quyên', 'Diệu', 'Tâm', 'Yến', 'Hiền', 'Phượng', 'Thu', 'Xuân', 'Liên', 'Cúc', 'Như'],
  prefix: ['Anh', 'Chị', 'Cô', 'Chú', 'Bác', 'Dì', 'Út', 'Ông', 'Bà'],
};

export const WISHES = [
  'Muốn thấy đèn đường sáng lại một lần.',
  'Muốn được ăn một bữa no không phải chia.',
  'Muốn có một mái nhà không dột.',
  'Muốn tìm lại tấm ảnh gia đình ở nhà cũ.',
  'Muốn nghe lại một bài hát trên radio.',
  'Muốn dạy chữ cho bọn trẻ.',
  'Muốn không ai phải chết vì sốt nữa.',
  'Muốn biết Tro từ đâu ra.',
];

export const CODEX = {
  dem_tro: {
    title: 'Đêm Tro',
    text: 'Không ai nhớ chính xác ngày nào. Người lớn tuổi kể rằng trời không tối mà xám lại, rồi một thứ bụi mịn như phấn rơi suốt ba tuần. Tro rơi lên điện thoại, điện thoại tắt. Rơi lên xe, xe đứng máy. Rơi lên thành phố, và thành phố im lặng.',
  },
  tram_bom: {
    title: 'Trạm Bơm Số 7',
    text: 'Một trong mười hai trạm chống ngập dọc Sông Hạ, xây năm 2041. Má Tư từng vận hành ca đêm ở đây suốt mười bốn năm. Bà nói: "Nó cứu cái thành phố này khỏi nước. Giờ tới lượt nó cứu mình."',
  },
  tro_nhiet: {
    title: 'Tro và hơi nóng',
    text: 'Tro bị hút về phía những thứ tỏa nhiệt, như thiêu thân tìm đèn. Lò nung, động cơ, tu-bin, thậm chí một đám đông quá lớn. Càng nóng, Tro càng dày. Muốn lớn mạnh thì phải chấp nhận nó tìm đến.',
  },
  hoi_sinh_1: {
    title: 'Tài liệu: HỒI SINH (mảnh 1)',
    text: '"...nanobot thế hệ 4 có khả năng phân rã polymer và cố định carbon ở quy mô khí quyển. Hội đồng đạo đức yêu cầu bổ sung giới hạn tự nhân bản. Đề xuất bị bác do tiến độ..." — trích tập tin trong ổ cứng thư viện Trường THPT Hạ Lưu.',
  },
  den_long: {
    title: 'Hội Đèn Lồng',
    text: 'Đoàn ghe buôn chạy dọc Sông Hạ, mỗi ghe treo một chiếc đèn lồng giấy, không bao giờ dùng đèn điện. Họ buôn mọi thứ trừ tin tức về thượng nguồn. Ai cũng biết họ biết nhiều hơn những gì họ nói.',
  },
  bay_soi: {
    title: 'Bầy Sói Kênh',
    text: 'Những nhóm cướp sống trên kênh rạch ngập phía nam. Họ đi bằng xuồng máy cải tiến chạy dầu dừa. Họ không giết người vô cớ, nhưng sẽ lấy mọi thứ bạn không giữ được.',
  },
  con_chau_tro: {
    title: 'Con Cháu Tro',
    text: 'Họ sống trong khu rừng mọc trên trung tâm cũ, da một số người đã kết tinh óng ánh. Họ gọi Đêm Tro là "Đêm Thanh Tẩy" và tin rằng thế giới đang tự chữa lành vết thương mang tên con người.',
  },
  ty: {
    title: 'Bé Tý',
    text: 'Sinh sau Đêm Tro, không cha, mẹ mất năm ngoái. Tý không sợ Tro. Có lần em đứng giữa trời Tro rơi, mở bàn tay ra và nói: "Nó ấm."',
  },
};
