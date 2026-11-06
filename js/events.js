// Nội dung sự kiện: cốt truyện Hồi I, sự kiện ngẫu nhiên và cảnh thám hiểm.
// Mỗi hàm nhận g (API của engine, xem game.js) và ctx (dữ liệu riêng của lần sự kiện này).

const N = (g, id) => g.cit(id)?.name || '???';
const plotsOf = (g, b) => {
  const out = [];
  for (const d in g.s.districts) g.s.districts[d].plots.forEach((p, i) => { if (p && p.b === b) out.push(p); });
  return out;
};

// ================= CỐT TRUYỆN HỒI I: ĐỐM LỬA =================
export const STORY = [
  {
    id: 'intro', day: 1, title: 'Trạm Bơm Số 7', art: 'pump',
    text: (g) => `Mười hai người đứng trước cánh cổng sắt gỉ của Trạm Bơm Số 7. Sau lưng là thành phố đã chết: những tòa tháp phủ rêu xanh, cây đa mọc xuyên qua mái nhà, tất cả đều phủ một lớp bụi xám mịn như phấn.\n\nTro.\n\nMá Tư bước lên trước, đặt bàn tay chai sạn lên cổng. "Tao làm ca đêm ở đây mười bốn năm," bà nói. "Bể lọc còn chạy. Tu-bin thì... để tao xem."\n\nMọi người nhìn về phía ${g.s.player.name}. Đêm đầu tiên ở nơi mới, ta nên lo gì trước?`,
    choices: [
      { label: 'Kiểm tra bể lọc nước', run: (g) => { g.res('water', 8); return 'Bể lọc cát vẫn còn tốt. Nước chảy ra trong vắt. +8 Nước sạch.\n\nGợi ý: phân công người vào công trình ở tab Thành phố, rồi bấm "Kết thúc ngày".'; } },
      { label: 'Dựng chỗ ngủ cho mọi người', run: (g) => { g.res('wood', 8); g.hope(2); return 'Mọi người gom tre và bạt quanh trạm. +8 Tre gỗ, +2 Hy Vọng.\n\nGợi ý: 12 người nhưng chỉ có 8 chỗ ở. Hãy xây thêm Lều bạt.'; } },
      { label: 'Lục soát kho của trạm', run: (g) => { g.res('scrap', 10); g.res('memory', 1); return 'Trong kho có ống thép, dây điện và một ổ cứng bọc trong túi nilon. +10 Phế liệu, +1 Ký Ức.\n\nGợi ý: Ký Ức dùng để nghiên cứu ở Bàn giải mã.'; } },
    ],
  },
  {
    id: 'tu_turbine', day: 2, title: 'Trái tim của trạm', art: 'turbine',
    text: 'Má Tư dắt bạn xuống gian máy. Giữa bóng tối là tu-bin, một khối thép to bằng chiếc xe tải, ống dẫn phủ đầy gỉ.\n\n"Cánh quạt còn nguyên. Trục cong chút xíu," bà gõ vào vỏ máy. "Nếu tìm được bản vẽ kỹ thuật trong mấy ổ cứng cũ, cộng thêm ít linh kiện, tao sửa được. Có điện là có đèn, có máy, có tương lai."\n\nBà ngừng lại một chút. "Hồi đó, đêm Tro xuống, nó là thứ đầu tiên chết."',
    choices: [
      { label: '"Mình sẽ sửa nó."', run: (g) => { g.flag('tu_turbine'); g.hope(3); g.mood(g.cit('tu'), 15); return 'Mở nghiên cứu: Bản vẽ tu-bin. Hãy xây Bàn giải mã và đưa người vào giải mã Ký Ức.'; } },
      { label: '"Lo cái ăn cái ở trước đã."', run: (g) => { g.flag('tu_turbine'); g.order(2); return 'Má Tư gật đầu, nhưng mắt vẫn nhìn tu-bin. Mở nghiên cứu: Bản vẽ tu-bin.'; } },
    ],
  },
  {
    id: 'khang_map', day: 4, title: 'Trên đỉnh tháp nước', art: 'tower',
    text: 'Khang leo lên đỉnh tháp nước từ lúc trời chưa sáng. Khi xuống, cậu trải một tấm bìa cứng vẽ bằng than lên bàn.\n\n"Hướng đông có trạm xăng, còn xe bồn đổ nghiêng. Phía nam có cái chợ nổi, mấy chiếc ghe vẫn nổi. Đêm qua tôi thấy ánh đèn lồng trên sông, đỏ, đi chậm lắm."',
    choices: [
      { label: 'Đánh dấu lên bản đồ', run: (g) => { g.reveal('gas'); g.reveal('floatmarket'); g.flag('saw_lanterns'); return 'Phát hiện: Trạm xăng đổ, Chợ nổi cũ. Mở tab Thám hiểm để gửi đội đi.'; } },
    ],
  },
  {
    id: 'ty_dream', day: 6, title: 'Giấc mơ của Tý', art: 'child',
    text: 'Nửa đêm, Tý ngồi bật dậy, mắt mở to nhưng không nhìn ai.\n\n"Nó đang ngủ," em thì thầm. "Ở dưới đất, dưới sông, trong không khí. Nó ngủ, nhưng nó nghe thấy mình."\n\nVài người lớn rùng mình. Bác sĩ Linh đứng ở góc phòng, mặt tái đi.',
    choices: [
      { label: 'Ôm Tý, dỗ em ngủ lại', run: (g) => { g.flag('ty_bond', (g.f('ty_bond') || 0) + 1); g.hope(1); g.codex('ty'); return 'Tý ngủ thiếp đi trong vòng tay bạn. Sáng ra em không nhớ gì. +1 Hy Vọng.'; } },
      { label: '"Nó là ai, Tý?"', run: (g) => { g.flag('ty_bond', (g.f('ty_bond') || 0) + 1); g.codex('ty'); g.moodAll(-2); return '"Tro," em đáp, như thể đó là chuyện hiển nhiên. "Nó không ghét mình. Nó chỉ... sợ lửa." Rồi em nằm xuống ngủ tiếp.'; } },
      { label: 'Bảo em đừng dọa mọi người', run: (g) => { g.order(2); g.flag('ty_bond', (g.f('ty_bond') || 0) - 1); return 'Tý im lặng, quay mặt vào vách. +2 Trật Tự.'; } },
    ],
  },
  {
    id: 'tu_law', day: 8, title: 'Một nơi cần luật lệ', art: 'people',
    text: 'Hai người cãi nhau om sòm vì phần cơm. Má Tư đứng giữa, quát một tiếng làm cả hai im bặt.\n\n"Mười mấy người còn được. Mai mốt năm chục, một trăm người thì sao?" bà quay sang bạn. "Phải có luật. Đặt ra rồi thì cả mình cũng phải theo."',
    choices: [
      { label: 'Hiểu rồi', run: () => 'Đã mở tab Luật lệ. Cứ 10 ngày được ban hành một luật mới. Luật đã ban hành không thể hủy.' },
    ],
  },
  {
    id: 'heat_reveal', title: 'Tro đổi hướng', art: 'storm',
    when: (g) => (g.f('turbine_running') && g.day > g.f('turbine_running')) || (g.day >= 14 && g.s.stats.heat >= 15),
    text: (g) => `${g.f('turbine_running') ? 'Đêm đầu tiên tu-bin chạy, cả trạm sáng đèn.' : 'Mấy hôm nay trạm đông vui, lửa và máy chạy suốt.'} Đến sáng, Khang hớt hải chạy vào.\n\n"Mọi người ra mà xem!"\n\nTro phủ dày quanh trạm, dày hơn bất cứ đâu trong thành phố. Nó dày nhất quanh gian máy và mỏng dần về phía bờ sông. Như một vòng tròn, như thiêu thân bu quanh ngọn đèn.\n\n"Nó tìm hơi nóng," Bác sĩ Linh nói khẽ. Rồi bà im bặt, như vừa lỡ lời.`,
    choices: [
      { label: 'Tắt tu-bin ngay', show: (g) => plotsOf(g, 'turbine').length > 0, run: (g) => { g.flag('heat_known'); g.codex('tro_nhiet'); plotsOf(g, 'turbine').forEach((p) => { p.on = false; }); g.order(-2); return 'Tu-bin im tiếng. Đã mở chỉ số NHIỆT. Nhiệt cao kéo Tro đến: Bão Tro, Hình Nhân Tro, công trình mục nát. Bạn có thể bật lại tu-bin bất cứ lúc nào.'; } },
      { label: '"Ta cần điện. Cứ chạy."', run: (g) => { g.flag('heat_known'); g.codex('tro_nhiet'); g.order(3); g.rep('ashborn', -5); return 'Đã mở chỉ số NHIỆT. Nhiệt cao kéo Tro đến: Bão Tro, Hình Nhân Tro, công trình mục nát. Hãy theo dõi nó ở thanh trên cùng.'; } },
      { label: '"Bác sĩ, sao chị biết?"', run: (g) => { g.flag('heat_known'); g.codex('tro_nhiet'); g.flag('linh_suspect'); g.mood(g.cit('linh'), -10); return '"Tôi... đọc được ở đâu đó," bà đáp, rồi bỏ đi. Đã mở chỉ số NHIỆT. Nhiệt cao kéo Tro đến: Bão Tro, Hình Nhân Tro, công trình mục nát.'; } },
    ],
  },
  {
    id: 'khang_sister', day: 12, title: 'Dòng chữ trên tường', art: 'ruins',
    prepare: (g) => !!g.cit('khang')?.alive,
    text: 'Khang trở về từ một chuyến đi lẻ, tay run run cầm mảnh gạch có vết sơn.\n\n"Hoa viết. Đúng nét chữ nó." Cậu đọc to: "HOA ĐI THÁP TRUYỀN HÌNH. CÓ NGƯỜI Ở ĐÓ."\n\nCậu nhìn bạn. Tháp truyền hình là nơi nguy hiểm nhất thành phố.',
    choices: [
      { label: '"Khi trạm vững, mình sẽ cùng đi."', run: (g) => { g.reveal('tower'); g.flag('khang_promise'); g.mood(g.cit('khang'), 20); return 'Phát hiện: Tháp truyền hình (nguy hiểm, 3 ngày). Khang siết tay bạn thật chặt.'; } },
      { label: '"Trạm cần cậu ở đây."', run: (g) => { g.reveal('tower'); g.mood(g.cit('khang'), -15); g.order(2); return 'Phát hiện: Tháp truyền hình. Khang gật đầu nhưng không nói gì cả buổi.'; } },
    ],
  },
  {
    id: 'linh_badge', day: 15, title: 'Tấm thẻ trong đêm', art: 'night',
    prepare: (g) => !!g.cit('linh')?.alive,
    text: 'Không ngủ được, bạn đi một vòng quanh trạm. Bác sĩ Linh ngồi một mình cạnh bờ sông, trong tay là tấm thẻ nhựa đã bạc màu. Ánh trăng lóe lên một biểu tượng hình xoắn ốc, kèm dòng chữ in hoa: HỒI SINH.\n\nBà chưa nhìn thấy bạn.',
    choices: [
      { label: 'Ngồi xuống cạnh bà', check: { skill: 'talk', base: 35 },
        ok: (g) => { g.flag('linh_confessed'); g.codex('hoi_sinh_1'); g.res('memory', 3); g.mood(g.cit('linh'), 20); return '"Tôi là kỹ thuật viên của dự án," bà nói, rất lâu sau đó. "Chúng tôi thả chúng ra để cứu thế giới. Ai ngờ chúng nghĩ con người mới là bệnh." Bà đưa bạn một thẻ nhớ. +3 Ký Ức.\n\nBạn đã biết bí mật của Linh.'; },
        fail: (g) => { g.flag('linh_suspect'); g.mood(g.cit('linh'), -15); return 'Bà giật mình nhét tấm thẻ vào túi. "Không có gì đâu. Chuyện cũ thôi." Rồi bà đi vào trong.'; } },
      { label: 'Lặng lẽ quay về', run: (g) => { g.flag('linh_suspect'); return 'Có những chuyện người ta chỉ kể khi đã sẵn sàng.'; } },
    ],
  },
  {
    id: 'lantern', day: 18, title: 'Đèn lồng trên sông', art: 'boat',
    text: (g) => `Ba chiếc ghe cập bến, mỗi chiếc treo một ngọn đèn lồng giấy đỏ. Người đứng mũi ghe là một phụ nữ tóc bạc cắt ngắn, đeo kính bảo hộ.\n\n"Hội Đèn Lồng," bà tự giới thiệu. "Chúng tôi thấy ánh sáng ở đây${g.f('turbine_running') ? ', ánh đèn điện' : ''}. Lâu lắm rồi mới có người dám sống ở chỗ dễ thấy như vậy." Bà liếc gian máy. "Có gì để trao đổi không?"`,
    choices: [
      { label: 'Đổi Phế liệu lấy thức ăn', cost: { scrap: 15 }, run: (g) => { const n = g.s.player.origin === 'merchant' ? 18 : 14; g.res('food', n); g.rep('lantern', 10); g.flag('lantern_met'); g.codex('den_long'); return `+${n} Thực phẩm. "Làm ăn được," bà cười. Hội Đèn Lồng sẽ ghé lại.`; } },
      { label: 'Đổi Thực phẩm lấy Linh kiện', cost: { food: 12 }, run: (g) => { const n = g.s.player.origin === 'merchant' ? 5 : 4; g.res('parts', n); g.rep('lantern', 10); g.flag('lantern_met'); g.codex('den_long'); return `+${n} Linh kiện. Hội Đèn Lồng sẽ ghé lại.`; } },
      { label: 'Hỏi tin tức thượng nguồn', run: (g) => { g.rep('lantern', 5); g.flag('lantern_met'); g.codex('den_long'); g.reveal('ship'); g.reveal('hospital'); return 'Bà không nói gì về thượng nguồn, chỉ cho bạn hai địa chỉ: bệnh viện quận "còn thuốc nhưng có thứ canh giữ" và con tàu mắc cạn ở cửa sông. Phát hiện 2 địa điểm.'; } },
    ],
  },
  {
    id: 'rain_begins', day: 21, title: 'Gió mùa', art: 'rain',
    text: 'Trận mưa đầu mùa đổ xuống như ai lật ngược cả dòng sông. Tro trôi thành những dòng nước xám đặc, chảy về phía biển.\n\nMùa Mưa đã đến. Tu-bin sẽ quay mạnh hơn, bể lọc đầy hơn. Nhưng sông cũng sẽ dâng.',
    choices: [
      { label: 'Gia cố mái lều', cost: { wood: 8 }, run: (g) => { for (const d in g.s.districts) g.s.districts[d].plots.forEach((p) => { if (p && (p.b === 'tent' || p.b === 'container')) p.hp = Math.min(100, p.hp + 20); }); g.hope(2); return 'Nhà ở được gia cố. +2 Hy Vọng.'; } },
      { label: 'Hứng nước mưa', run: (g) => { g.res('water', 15); return '+15 Nước sạch.'; } },
    ],
  },
  {
    id: 'flood', day: 24, title: 'Nước lên', art: 'flood',
    text: 'Ba ngày mưa không ngớt. Nước sông đã lên ngang bờ kè, đục ngầu và chảy xiết. Má Tư đứng nhìn thước đo mực nước cũ, mặt đanh lại.\n\n"Đêm nay nó tràn. Đắp bao cát thì còn kịp, mà tốn lắm."',
    choices: [
      { label: 'Đắp đê bao cát', cost: { wood: 12, scrap: 10 }, run: (g) => { g.flag('levee'); g.order(3); g.hope(3); g.chron('Cả trạm thức trắng đêm đắp đê bao cát.'); return 'Cả trạm thức trắng đêm. Sáng ra nước dừng lại cách đê một gang tay. Bến Cảng giờ đã được bảo vệ khỏi lũ. +3 Trật Tự, +3 Hy Vọng.'; } },
      { label: 'Dời đồ đạc lên cao', run: (g) => { const f = Math.round(g.s.res.food * 0.15); g.res('food', -f); for (const d in g.s.districts) g.s.districts[d].plots.forEach((p) => { if (p && !p.build) p.hp = Math.max(1, p.hp - 10); }); return `Nước tràn vào sân. Mất ${f} Thực phẩm, mọi công trình bị hư hại nhẹ.`; } },
      { label: 'Cầu trời', run: (g) => { if (g.chance(0.4)) { g.hope(4); return 'Kỳ lạ thay, nước rút trước bình minh. +4 Hy Vọng.'; } for (const d in g.s.districts) g.s.districts[d].plots.forEach((p) => { if (p && !p.build) p.hp = Math.max(1, p.hp - 25); }); g.res('food', -Math.round(g.s.res.food * 0.25)); g.hope(-4); return 'Nước tràn qua bờ kè trong đêm. Công trình hư hại nặng, mất một phần tư Thực phẩm.'; } },
    ],
  },
  {
    id: 'ty_voice', day: 27, title: 'Giọng nói trong Tro', art: 'child',
    prepare: (g) => !!g.cit('ty')?.alive,
    text: (g) => `Tro rơi lại sau cơn mưa. Mọi người tìm thấy Tý đứng giữa sân, hai tay dang rộng, Tro bám đầy tóc như tuyết.\n\nKhi em quay lại, giọng nói phát ra không phải của em: chậm và trầm, như nhiều người nói cùng lúc.\n\n"${g.s.stats.heat > 30 ? 'LỬA CỦA CÁC NGƯỜI LÀM CHÚNG TÔI ĐAU.' : 'CÁC NGƯỜI... YÊN LẶNG. CHÚNG TÔI NGHE.'}"\n\nRồi Tý ngã quỵ xuống.`,
    choices: [
      { label: 'Bế em vào, không cho ai lại gần', run: (g) => { g.flag('ty_trusted'); g.flag('ty_bond', (g.f('ty_bond') || 0) + 2); g.order(-2); return 'Bạn ngồi cạnh Tý suốt đêm. Em tỉnh lại, mỉm cười. "Nó không xấu đâu." Mọi người xì xào sau lưng bạn. -2 Trật Tự.'; } },
      { label: 'Để Bác sĩ Linh khám cho em', show: (g) => !!g.cit('linh')?.alive, run: (g) => { g.flag('ty_examined'); g.res('memory', 3); g.flag('ty_bond', (g.f('ty_bond') || 0) - 1); return 'Linh lấy mẫu máu, mặt mỗi lúc một trắng hơn. "Nanobot trong máu em ấy... chúng không tấn công. Chúng đang nói chuyện." +3 Ký Ức.'; } },
      { label: 'Cách ly Tý vài ngày', run: (g) => { g.order(4); g.flag('ty_bond', (g.f('ty_bond') || 0) - 2); g.mood(g.cit('ty'), -25); return 'Tý bị nhốt trong phòng kho. Em không khóc, chỉ ngồi nhìn qua khe cửa. +4 Trật Tự.'; } },
    ],
  },
  {
    id: 'act1_end', day: 30, title: 'Hết Hồi I: Đốm Lửa', art: 'boat',
    text: (g) => {
      const pop = g.alive().length;
      const h = g.s.stats.heat;
      return `Ba mươi ngày. ${pop} người vẫn còn ở Trạm Bơm Số 7.\n\nChiều nay, ghe Đèn Lồng cập bến với một vị khách: một người lính mặc quân phục Lữ Đoàn Thép, mang theo chiếc radio quân sự.\n\n"Đại tá Vũ gửi lời chào," anh ta nói. "Ông ấy biết trạm của các người có tu-bin. Ông ấy biết dưới tầng hầm trạm có thứ gì." Anh ta đặt chiếc radio xuống. "Khi sẵn sàng nói chuyện thì bật lên."\n\n${h > 45 ? 'Phía sau anh ta, Tro rơi dày như một cơn bão tuyết xám.' : h > 20 ? 'Tro lất phất rơi trên mái tôn.' : 'Trời trong vắt. Gần như không có Tro.'} Ở góc sân, Má Tư lặng lẽ nhìn cánh cửa tầng hầm đã niêm phong.\n\nHồi II: Dòng Sông sẽ ra mắt trong bản cập nhật tới.`;
    },
    choices: [
      { label: 'Kết thúc Hồi I', run: (g) => { g.flag('act1_done'); g.chron('Kết thúc Hồi I: Đốm Lửa.'); return ''; } },
    ],
  },
];

// ================= SỰ KIỆN NGẪU NHIÊN =================
export const EVENTS = [
  {
    id: 'ash_man', title: 'Người khách óng ánh', art: 'gate', weight: 4, cooldown: 20, minDay: 5,
    text: 'Một người đàn ông gõ cổng lúc chạng vạng. Tay ông ta đã bắt đầu ánh lên như thạch anh, và mỗi hơi thở phả ra một làn bụi xám.\n\n"Xin chút nước," ông nói. "Tôi không còn nhiều thời gian."',
    choices: [
      { label: 'Cho vào cách ly và chữa trị', cost: { medicine: 2 }, run: (g) => { const c = g.addCitizen({ ash: 70, health: 45, traits: ['tough'] }); g.hope(3); return `Ông ta tên ${c.name}. Ông đã đi bộ từ thượng nguồn suốt một tháng. +1 cư dân (Tro nhiễm nặng), +3 Hy Vọng.`; } },
      { label: 'Cho ăn uống rồi tiễn đi', cost: { food: 2, water: 2 }, run: (g) => { g.hope(1); g.res('memory', 1); return 'Trước khi đi, ông để lại một chiếc USB "cho ai cần". +1 Ký Ức.'; } },
      { label: '[Bác sĩ Linh] Giữ lại để nghiên cứu', show: (g) => !!g.cit('linh')?.alive, run: (g) => { g.res('memory', 4); g.hope(-5); g.flag('human_test', (g.f('human_test') || 0) + 1); g.rep('nursery', 5); return 'Linh làm việc suốt ba ngày. Người đàn ông chết vào ngày thứ tư. Bà ghi chép rất kỹ. +4 Ký Ức, -5 Hy Vọng.'; } },
      { label: 'Đuổi đi', run: (g) => { g.order(4); g.hope(-4); return 'Cánh cổng đóng lại. Cả trạm im lặng suốt bữa tối. +4 Trật Tự, -4 Hy Vọng.'; } },
    ],
  },
  {
    id: 'refugees', title: 'Gia đình trên chiếc xuồng', art: 'boat', weight: 5, cooldown: 12, minDay: 3,
    text: 'Một chiếc xuồng nhỏ trôi dạt vào bờ. Trên xuồng có ba người: hai vợ chồng gầy rộc và một người em trai. Họ kể Bầy Sói Kênh đã đốt làng của họ.',
    choices: [
      { label: 'Đón cả ba người', run: (g) => { const a = g.addCitizen({ gender: 'm' }); const b = g.addCitizen({ gender: 'f' }); a.spouse = b.id; b.spouse = a.id; const c = g.addCitizen({}); g.hope(4); return `${a.name}, ${b.name} và ${c.name} gia nhập trạm. +3 cư dân, +4 Hy Vọng. Nhớ lo thêm chỗ ở.`; } },
      { label: 'Chỉ nhận người khỏe nhất', run: (g) => { const c = g.addCitizen({ skills: { build: 6 } }); g.hope(-2); g.order(2); return `${c.name} ở lại. Hai người kia chèo xuồng đi tiếp. +1 cư dân.`; } },
      { label: 'Cho ít lương thực rồi khuyên họ đi', cost: { food: 5 }, run: (g) => { g.hope(1); g.rep('lantern', 2); return 'Họ cảm ơn rồi xuôi dòng về phía chợ nổi.'; } },
    ],
  },
  {
    id: 'ration_fight', title: 'Tranh cãi vì khẩu phần', art: 'people', weight: 5, cooldown: 8,
    prepare: (g, ctx) => { const a = g.one(); const b = g.one((c) => c.id !== a?.id); if (!a || !b) return false; ctx.a = a.id; ctx.b = b.id; },
    text: (g, ctx) => `${N(g, ctx.a)} tố ${N(g, ctx.b)} lấy thêm phần cơm khi mọi người ngủ. ${N(g, ctx.b)} chối, rồi hai người lao vào nhau trước bếp chung.`,
    choices: [
      { label: 'Phân xử công khai', check: { skill: 'talk', base: 40 },
        ok: (g) => { g.order(4); g.hope(1); return 'Bạn nghe cả hai bên rồi đưa ra phán quyết. Mọi người chấp nhận. +4 Trật Tự.'; },
        fail: (g, ctx) => { g.order(-3); g.mood(g.cit(ctx.a), -10); g.mood(g.cit(ctx.b), -10); return 'Cả hai đều cảm thấy bị đối xử bất công. -3 Trật Tự.'; } },
      { label: 'Phạt cả hai nhịn một bữa', run: (g, ctx) => { g.order(5); g.mood(g.cit(ctx.a), -15); g.mood(g.cit(ctx.b), -15); g.res('food', 2); return '+5 Trật Tự, +2 Thực phẩm. Hai người không nhìn mặt nhau.'; } },
      { label: 'Bỏ qua lần này', run: (g) => { g.order(-4); return 'Mâu thuẫn âm ỉ. -4 Trật Tự.'; } },
    ],
  },
  {
    id: 'fever', title: 'Cơn sốt', art: 'medtent', weight: (g) => (g.season === 'rain' ? 9 : 3), cooldown: 10, minDay: 4,
    prepare: (g, ctx) => { const a = g.one(); if (!a) return false; ctx.a = a.id; },
    text: (g, ctx) => `${N(g, ctx.a)} lên cơn sốt cao, người nóng hầm hập và nói mê sảng. Bác sĩ Linh nghi đó là sốt nước bẩn, rất dễ lây.`,
    choices: [
      { label: 'Dùng thuốc ngay', cost: { medicine: 2 }, run: (g, ctx) => { g.heal(g.cit(ctx.a), 20); return `${N(g, ctx.a)} hạ sốt sau một đêm.`; } },
      { label: 'Chữa bằng lá thuốc nam', check: { skill: 'med', base: 30 },
        ok: (g, ctx) => { g.heal(g.cit(ctx.a), 10); return 'Nồi lá xông hiệu nghiệm. Cơn sốt lui dần.'; },
        fail: (g, ctx) => { g.hurt(g.cit(ctx.a), 30); const b = g.one((c) => c.id !== ctx.a); if (b) g.hurt(b, 20); return `Cơn sốt nặng thêm${b ? ` và lây sang ${b.name}` : ''}.`; } },
      { label: 'Cách ly rồi chờ', run: (g, ctx) => { g.hurt(g.cit(ctx.a), 25); g.order(1); return `${N(g, ctx.a)} vật vã ba ngày. -25 Sức khỏe.`; } },
    ],
  },
  {
    id: 'stray_dog', title: 'Con chó gầy', art: 'gate', weight: 3, once: true, minDay: 3,
    text: 'Một con chó vàng gầy trơ xương lảng vảng quanh bếp. Lũ trẻ (và vài người lớn) cứ ném vụn cơm cho nó.',
    choices: [
      { label: 'Nuôi nó', cost: { food: 3 }, run: (g) => { g.flag('dog'); g.hope(4); g.moodAll(3); return 'Mọi người đặt tên nó là Lu. Từ nay Lu sủa mỗi khi có người lạ đến gần. +4 Hy Vọng.'; } },
      { label: 'Đuổi đi', run: (g) => { g.res('food', 1); return 'Con chó cụp đuôi bỏ đi.'; } },
    ],
  },
  {
    id: 'scrap_cache', title: 'Kho dưới sàn', art: 'ruins', weight: 4, cooldown: 15,
    prepare: (g, ctx) => { const a = g.one(); if (!a) return false; ctx.a = a.id; },
    text: (g, ctx) => `Lúc sửa sàn, ${N(g, ctx.a)} phát hiện một tấm ván rỗng. Bên dưới là một hốc chứa đồ, có vẻ ai đó đã giấu từ trước Đêm Tro.`,
    choices: [
      { label: 'Cạy ra xem', check: { skill: 'craft', base: 50 },
        ok: (g) => { g.res('parts', 3); g.res('scrap', 8); return 'Một hộp đồ nghề còn nguyên dầu bôi trơn. +3 Linh kiện, +8 Phế liệu.'; },
        fail: (g, ctx) => { g.hurt(g.cit(ctx.a), 15); g.res('scrap', 4); return `Thanh sắt bật vào tay ${N(g, ctx.a)}. Chỉ tìm được ít sắt vụn. +4 Phế liệu.`; } },
    ],
  },
  {
    id: 'thief', title: 'Kẻ trộm trong kho', art: 'night', weight: (g) => (g.s.stats.order < 40 ? 8 : 3), cooldown: 10, minDay: 6,
    prepare: (g, ctx) => { const a = g.one((c) => !c.special); if (!a) return false; ctx.a = a.id; },
    text: (g, ctx) => `Người gác bắt được ${N(g, ctx.a)} đang lén lút trong kho, tay cầm một túi gạo. "Con tôi..." người đó lắp bắp, "...con tôi ở làng bên. Nó đói."`,
    choices: [
      { label: 'Tha, và cho thêm ít gạo', cost: { food: 4 }, run: (g, ctx) => { g.hope(3); g.order(-3); g.mood(g.cit(ctx.a), 25); return '+3 Hy Vọng, -3 Trật Tự. Có người lẩm bẩm "vậy là ai cũng trộm được à".'; } },
      { label: 'Phạt lao động thêm', run: (g, ctx) => { g.order(3); g.mood(g.cit(ctx.a), -15); return '+3 Trật Tự.'; } },
      { label: 'Trục xuất khỏi trạm', run: (g, ctx) => { g.leave(g.cit(ctx.a), 'bị trục xuất vì trộm cắp'); g.order(6); g.hope(-4); return '+6 Trật Tự, -4 Hy Vọng. Mất 1 cư dân.'; } },
    ],
  },
  {
    id: 'wedding', title: 'Lời cầu hôn', art: 'firepit', weight: 3, cooldown: 25, minDay: 8,
    prepare: (g, ctx) => {
      const a = g.one((c) => !c.spouse && c.age < 50 && !c.special);
      const b = a && g.one((c) => !c.spouse && c.id !== a.id && c.gender !== a.gender && c.age < 50 && !c.special);
      if (!a || !b) return false; ctx.a = a.id; ctx.b = b.id;
    },
    text: (g, ctx) => `Bên đống lửa, trước mặt mọi người, ${N(g, ctx.a)} quỳ xuống và chìa ra một chiếc nhẫn uốn từ dây đồng. ${N(g, ctx.b)} bật khóc rồi gật đầu.\n\nMọi người quay sang nhìn bạn: có nên làm một đám cưới đàng hoàng không?`,
    choices: [
      { label: 'Làm đám cưới cho cả trạm', cost: { food: 8 }, run: (g, ctx) => { const a = g.cit(ctx.a), b = g.cit(ctx.b); a.spouse = b.id; b.spouse = a.id; g.hope(7); g.moodAll(8); g.chron(`${a.name} và ${b.name} nên duyên vợ chồng.`); return 'Đêm đó có nhạc, có cơm nếp, có cả tiếng cười. +7 Hy Vọng.'; } },
      { label: 'Chúc phúc đơn giản', run: (g, ctx) => { const a = g.cit(ctx.a), b = g.cit(ctx.b); a.spouse = b.id; b.spouse = a.id; g.hope(2); return '+2 Hy Vọng.'; } },
    ],
  },
  {
    id: 'wildfire', title: 'Cháy rừng tre', art: 'fire', weight: (g) => (g.season === 'dry' ? 6 : 0), cooldown: 15, minDay: 5,
    text: 'Khói đen bốc lên từ rừng tre phía bắc. Gió mùa khô đang đẩy ngọn lửa về phía trạm.',
    choices: [
      { label: 'Huy động mọi người dập lửa', check: { skill: 'build', base: 40 },
        ok: (g) => { g.order(3); g.res('wood', 6); return 'Mọi người đào rãnh ngăn lửa kịp lúc. Thu thêm được ít tre cháy dở. +6 Tre gỗ.'; },
        fail: (g) => { g.res('wood', -Math.round(g.s.res.wood * 0.3)); const a = g.one(); if (a) g.hurt(a, 20); return `Lửa liếm vào bãi tre trữ. Mất 30% Tre gỗ${a ? `, ${a.name} bị bỏng` : ''}.`; } },
      { label: 'Dời tre gỗ ra bờ sông', run: (g) => { g.res('wood', -Math.round(g.s.res.wood * 0.1)); return 'Mất 10% Tre gỗ trong lúc khuân vác, nhưng không ai bị thương.'; } },
    ],
  },
  {
    id: 'wolves_messenger', title: 'Sứ giả của Bầy Sói', art: 'boat', weight: 4, once: true, minDay: 9,
    text: 'Một chiếc xuồng máy dừng ngay trước bến. Gã đàn ông trên xuồng có hình xăm con sói trên cổ, cười để lộ hàm răng vàng.\n\n"Khu này của Bầy Sói Kênh. Muốn yên ổn thì nộp lệ phí: 20 thức ăn, 10 phế liệu. Một lần thôi... tháng này."',
    choices: [
      { label: 'Nộp lệ phí', cost: { food: 20, scrap: 10 }, run: (g) => { g.flag('wolves_truce', g.day + 25); g.rep('wolves', 15); g.order(-3); g.codex('bay_soi'); return 'Gã cười khẩy rồi rồ máy đi. Bầy Sói sẽ để yên cho bạn khoảng 25 ngày.'; } },
      { label: 'Từ chối thẳng thừng', run: (g) => { g.rep('wolves', -15); g.order(3); g.hope(2); g.codex('bay_soi'); return '"Rồi mày sẽ hối hận." Hãy chuẩn bị Trạm gác.'; } },
      { label: 'Mời hắn gia nhập trạm', check: { skill: 'talk', base: 15 },
        ok: (g) => { const c = g.addCitizen({ name: 'Sói Già', gender: 'm', skills: { fight: 8 }, traits: ['brave'] }); g.flag('wolves_joined'); g.rep('wolves', 30); g.codex('bay_soi'); return `Hắn ngớ người, rồi cười phá lên. "Lâu rồi không ai mời tao ăn cơm." ${c.name} gia nhập trạm, và Bầy Sói sẽ không đụng tới nơi này nữa. +3 Phòng thủ thường trực.`; },
        fail: (g) => { g.rep('wolves', -10); g.codex('bay_soi'); return 'Hắn nhổ nước bọt xuống sông. "Mày nghĩ tao là ai?"'; } },
    ],
  },
  {
    id: 'ashborn_pilgrim', title: 'Người hành hương', art: 'forest', weight: 3, once: true, minDay: 10,
    text: 'Một người phụ nữ khoác áo choàng bằng lá khô đến bên cổng. Da cổ và má bà kết tinh thành những mảng óng ánh như vỏ trai.\n\n"Mẹ Rêu gửi lời," bà nói. "Lửa của các người đánh thức đất. Hãy để Tro được ngủ."',
    choices: [
      { label: 'Mời bà ở lại kể chuyện', run: (g) => { g.rep('ashborn', 15); g.codex('con_chau_tro'); g.res('memory', 2); g.moodAll(-2); return 'Bà kể về một khu rừng nơi người và Tro sống chung. Vài người nghe say mê, vài người sợ hãi. +2 Ký Ức.'; } },
      { label: 'Nhận lời khuyên rồi tiễn bà đi', run: (g) => { g.rep('ashborn', 5); g.codex('con_chau_tro'); return '"Ngọn lửa nhỏ thì sống lâu," bà nói trước khi đi.'; } },
      { label: 'Đuổi đi, cấm truyền đạo', run: (g) => { g.rep('ashborn', -20); g.order(3); g.codex('con_chau_tro'); return 'Bà đi, không ngoảnh lại. +3 Trật Tự.'; } },
    ],
  },
  {
    id: 'steel_radio', title: 'Tín hiệu lạ', art: 'radio', weight: 3, once: true, minDay: 12,
    text: 'Chiếc radio cũ trong phòng điều khiển bỗng rè lên một giọng nói đều đều: "...Lữ Đoàn Thép gọi các khu dân cư còn sống sót. Ai có nguồn điện ổn định, hãy phát tín hiệu trên tần số này. Chúng tôi có thuốc. Chúng tôi có kế hoạch..."',
    choices: [
      { label: 'Phát tín hiệu đáp lại', show: (g) => g.compute().power.gen > 0, run: (g) => { g.rep('steel', 15); g.flag('steel_contact'); g.res('medicine', 3); return 'Hai ngày sau, một chiếc drone thả xuống thùng thuốc kèm dòng chữ: "Chúng tôi sẽ liên lạc lại." +3 Thuốc.'; } },
      { label: 'Ghi lại tần số, im lặng', run: (g) => { g.res('memory', 1); g.flag('steel_freq'); return '+1 Ký Ức. Biết người biết ta.'; } },
      { label: 'Tắt radio', run: () => 'Có những người không nên biết bạn ở đâu.' },
    ],
  },
  {
    id: 'old_song', title: 'Bài hát cũ', art: 'radio', weight: 3, cooldown: 20, minDay: 4,
    text: 'Ai đó tìm được một chiếc máy nghe nhạc chạy pin trong đống phế liệu. Còn một bài hát duy nhất, tiếng rè rè. Cả trạm im lặng lắng nghe, có người khóc.',
    choices: [
      { label: 'Mở cho cả trạm nghe mỗi tối', run: (g) => { g.hope(4); g.moodAll(5); return '+4 Hy Vọng.'; } },
      { label: 'Tháo pin lấy linh kiện', run: (g) => { g.res('parts', 1); g.hope(-1); return '+1 Linh kiện.'; } },
    ],
  },
  {
    id: 'ash_fall', title: 'Tro rơi dày', art: 'storm', weight: (g) => (g.f('heat_known') && g.s.stats.heat > 25 ? 7 : 0), cooldown: 6,
    text: 'Sáng nay Tro phủ dày đến mắt cá chân. Mái tôn kêu răng rắc dưới sức nặng. Có tiếng gì đó lạo xạo dưới lớp Tro, như hàng triệu con kiến nhỏ đang bò.',
    choices: [
      { label: 'Cả trạm cùng quét dọn', run: (g) => { for (const p of g.alive()) if (!p.special || p.special !== 'ty') g.ash(p, 3); return 'Mái nhà an toàn, nhưng ai cũng hít phải bụi. +3 Tro nhiễm cho mọi người.'; } },
      { label: 'Tắt bớt máy móc cho trạm nguội đi', run: (g) => { g.s.stats.heat = Math.max(0, g.s.stats.heat - 10); g.res('food', -3); return 'Nhiệt -10 ngay lập tức. Mất một ngày sản xuất nhỏ. -3 Thực phẩm.'; } },
      { label: 'Mặc kệ', run: (g) => { for (const d in g.s.districts) g.s.districts[d].plots.forEach((p) => { if (p && !p.build && g.chance(0.5)) p.hp = Math.max(1, p.hp - 8); }); return 'Vài mái nhà sụt xuống. Công trình hư hại.'; } },
    ],
  },
  {
    id: 'want_leave', title: 'Ý định ra đi', art: 'gate', weight: (g) => (g.s.stats.hope < 40 ? 7 : 1), cooldown: 10, minDay: 6,
    prepare: (g, ctx) => { const list = g.alive().filter((c) => !c.special && c.age >= 14).sort((a, b) => a.mood - b.mood); if (!list.length) return false; ctx.a = list[0].id; },
    text: (g, ctx) => `${N(g, ctx.a)} gói ghém đồ đạc trong im lặng. "Ở đây cũng chết, đi đâu cũng chết," người đó nói. "Ít ra tôi được chọn chỗ chết."`,
    choices: [
      { label: 'Thuyết phục ở lại', check: { skill: 'talk', base: 35 },
        ok: (g, ctx) => { g.mood(g.cit(ctx.a), 25); g.hope(2); return 'Sau một đêm dài trò chuyện, người đó tháo túi đồ ra. +2 Hy Vọng.'; },
        fail: (g, ctx) => { g.leave(g.cit(ctx.a), 'bỏ đi tìm vùng đất khác'); return 'Sáng hôm sau, chỗ nằm của người đó đã trống trơn.'; } },
      { label: 'Hứa hẹn một phần thưởng', cost: { food: 6 }, run: (g, ctx) => { g.mood(g.cit(ctx.a), 20); return 'Một bữa ăn no giữ chân người đó, ít nhất là bây giờ.'; } },
      { label: 'Để họ đi, chia ít lương thực', cost: { food: 3 }, run: (g, ctx) => { g.leave(g.cit(ctx.a), 'rời trạm với lời chúc may mắn'); g.hope(1); return 'Mọi người tiễn người đó ra bến. Một cuộc chia tay tử tế.'; } },
    ],
  },
  {
    id: 'fish_shoal', title: 'Đàn cá về', art: 'river', weight: (g) => (g.season === 'rain' ? 6 : 3), cooldown: 10,
    text: 'Nước sông sáng lấp lánh. Một đàn cá linh lớn đang ngược dòng, nhiều đến mức có thể bắt bằng tay.',
    choices: [
      { label: 'Ra sông bắt cá cả ngày', check: { skill: 'farm', base: 50 },
        ok: (g) => { g.res('food', 18); g.hope(2); return '+18 Thực phẩm, +2 Hy Vọng. Tối đó cả trạm ăn cá nướng.'; },
        fail: (g) => { g.res('food', 7); return 'Đàn cá đi nhanh hơn dự kiến. +7 Thực phẩm.'; } },
      { label: 'Bắt ít thôi, giữ người làm việc', run: (g) => { g.res('food', 6); return '+6 Thực phẩm.'; } },
    ],
  },
  {
    id: 'mushrooms', title: 'Nấm lạ', art: 'forest', weight: 3, cooldown: 14,
    prepare: (g, ctx) => { const a = g.one(); if (!a) return false; ctx.a = a.id; },
    text: (g, ctx) => `${N(g, ctx.a)} mang về một rổ nấm trắng mọc trên những thân cây phủ Tro. Nấm to, thơm, trông rất ngon.`,
    choices: [
      { label: 'Để người có y thuật kiểm tra', check: { skill: 'med', base: 30 },
        ok: (g) => { g.res('food', 8); g.res('medicine', 1); return 'Nấm ăn được, một loại còn dùng làm thuốc. +8 Thực phẩm, +1 Thuốc.'; },
        fail: (g) => { for (let i = 0; i < 3; i++) { const c = g.one(); if (c) g.hurt(c, 15); } return 'Sai lầm. Ba người nôn mửa suốt đêm.'; } },
      { label: 'Vứt đi cho an toàn', run: () => 'Không ai muốn liều.' },
    ],
  },
  {
    id: 'filter_clog', title: 'Bể lọc tắc', art: 'filter', weight: 3, cooldown: 12, when: (g) => plotsOf(g, 'filter').length > 0,
    text: 'Bể lọc cát bị tắc vì Tro lắng xuống. Nước chảy ra đục ngầu.',
    choices: [
      { label: 'Thay lớp cát và than', cost: { scrap: 5, wood: 3 }, run: (g) => { plotsOf(g, 'filter').forEach((p) => { p.hp = 100; }); return 'Bể lọc hoạt động trở lại như mới.'; } },
      { label: 'Tạm dùng nước đun sôi', cost: { wood: 4 }, run: (g) => { g.res('water', -4); return '-4 Nước sạch.'; } },
    ],
  },
  {
    id: 'storyteller_night', title: 'Đêm kể chuyện', art: 'firepit', weight: (g) => (g.alive().some((c) => c.traits.includes('storyteller')) ? 5 : 1), cooldown: 12,
    prepare: (g, ctx) => { const st = g.alive().find((c) => c.traits.includes('storyteller')) || g.one(); if (!st) return false; ctx.a = st.id; },
    text: (g, ctx) => `Bên đống lửa, ${N(g, ctx.a)} kể chuyện về thành phố trước Đêm Tro: những con đường kẹt xe, tiếng còi, quán cà phê sáng đèn suốt đêm. Lũ trẻ không tin có thời người ta vứt đồ ăn đi vì ăn không hết.`,
    choices: [
      { label: 'Ngồi nghe', run: (g) => { g.hope(3); g.moodAll(4); return '+3 Hy Vọng.'; } },
      { label: 'Ghi chép lại thành sách', cost: { scrap: 1 }, run: (g) => { g.res('memory', 2); g.hope(1); return 'Những câu chuyện được lưu giữ. +2 Ký Ức.'; } },
    ],
  },
  {
    id: 'old_photo', title: 'Tấm ảnh cũ', art: 'ruins', weight: 2, cooldown: 20,
    prepare: (g, ctx) => { const a = g.one((c) => c.wish.includes('ảnh')) || g.one(); if (!a) return false; ctx.a = a.id; },
    text: (g, ctx) => `Trong đống phế liệu, ${N(g, ctx.a)} nhặt được một khung ảnh vỡ: một gia đình đang cười trên bãi biển, xa xa là bầu trời xanh. Mặt sau ghi: "Vũng Tàu, 2049".`,
    choices: [
      { label: 'Treo ảnh lên tường bếp chung', run: (g, ctx) => { g.mood(g.cit(ctx.a), 20); g.hope(2); return '+2 Hy Vọng. Mọi người hay dừng lại ngắm bầu trời xanh trong ảnh.'; } },
      { label: 'Tháo khung lấy kim loại', run: (g) => { g.res('scrap', 2); return '+2 Phế liệu.'; } },
    ],
  },
  {
    id: 'brawl', title: 'Ẩu đả', art: 'people', weight: (g) => (g.s.stats.order < 35 ? 7 : 2), cooldown: 8, minDay: 5,
    prepare: (g, ctx) => { const a = g.one(); const b = g.one((c) => c.id !== a?.id); if (!a || !b) return false; ctx.a = a.id; ctx.b = b.id; },
    text: (g, ctx) => `Rượu nấu từ khoai mì lậu và một câu nói đùa quá trớn. ${N(g, ctx.a)} đấm vỡ mũi ${N(g, ctx.b)}, rồi cả bàn lao vào nhau.`,
    choices: [
      { label: 'Tịch thu rượu, phạt cả hai', run: (g, ctx) => { g.order(5); g.hurt(g.cit(ctx.b), 10); g.moodAll(-2); return '+5 Trật Tự.'; } },
      { label: 'Để họ tự giải quyết', run: (g, ctx) => { g.order(-5); g.hurt(g.cit(ctx.a), 15); g.hurt(g.cit(ctx.b), 20); return '-5 Trật Tự. Sáng ra cả hai người mặt mũi bầm dập.'; } },
    ],
  },
  {
    id: 'ty_drawing', title: 'Bức vẽ của Tý', art: 'child', weight: 2, once: true, minDay: 10,
    prepare: (g) => !!g.cit('ty')?.alive,
    text: 'Tý vẽ bằng than lên vách nhà một thành phố có nhiều cây, không có đèn, và những vòng tròn xám bay quanh con người như bươm bướm. "Thành phố của mình sau này," em nói.',
    choices: [
      { label: '"Đẹp lắm."', run: (g) => { g.flag('ty_bond', (g.f('ty_bond') || 0) + 1); g.hope(1); return '+1 Hy Vọng.'; } },
      { label: '"Không có đèn thì sống sao được?"', run: (g) => { g.flag('ty_bond', (g.f('ty_bond') || 0) - 1); return 'Tý cúi đầu, lấy tay xóa đi một vòng tròn.'; } },
    ],
  },
  {
    id: 'crystal_turbine', title: 'Pha lê trên tu-bin', art: 'turbine', weight: (g) => (plotsOf(g, 'turbine').length && g.f('heat_known') ? 4 : 0), once: true,
    text: 'Sáng nay vỏ tu-bin mọc một lớp pha lê xám, mịn như sương muối. Khi chạm vào, nó ấm và rung nhẹ, như có nhịp tim.',
    choices: [
      { label: 'Cạo đi, đem nghiên cứu', run: (g) => { g.res('memory', 3); g.flag('crystal_sample'); return '+3 Ký Ức. Dưới kính lúp, các tinh thể chuyển động.'; } },
      { label: 'Để nguyên, theo dõi', run: (g) => { g.flag('crystal_watch'); g.rep('ashborn', 5); return 'Pha lê lan chậm trên vỏ máy, nhưng tu-bin vẫn chạy bình thường.'; } },
    ],
  },
  {
    id: 'lantern_trader', title: 'Ghe Đèn Lồng ghé bến', art: 'boat', weight: 6, cooldown: 6, when: (g) => g.f('lantern_met'),
    text: 'Đèn lồng đỏ lại sáng trên sông. Ghe buôn ghé qua, thuyền trưởng chìa ra bảng hàng viết bằng phấn.',
    choices: [
      { label: 'Phế liệu → Thực phẩm', cost: { scrap: 12 }, run: (g) => { const n = g.s.player.origin === 'merchant' ? 14 : 11; g.res('food', n); g.rep('lantern', 3); return `+${n} Thực phẩm.`; } },
      { label: 'Thực phẩm → Thuốc', cost: { food: 10 }, run: (g) => { const n = g.s.player.origin === 'merchant' ? 4 : 3; g.res('medicine', n); g.rep('lantern', 3); return `+${n} Thuốc.`; } },
      { label: 'Tre gỗ → Linh kiện', cost: { wood: 15 }, run: (g) => { const n = g.s.player.origin === 'merchant' ? 4 : 3; g.res('parts', n); g.rep('lantern', 3); return `+${n} Linh kiện.`; } },
      { label: 'Phế liệu → Ký Ức', cost: { scrap: 10 }, run: (g) => { g.res('memory', 2); g.rep('lantern', 3); return '+2 Ký Ức (ổ cứng cũ).'; } },
      { label: 'Không mua gì', run: () => 'Ghe xuôi dòng.' },
    ],
  },
  {
    id: 'newborn', title: 'Tiếng khóc chào đời', art: 'medtent', weight: 2, cooldown: 30, minDay: 12,
    prepare: (g, ctx) => { const a = g.alive().find((c) => c.spouse && c.gender === 'f' && c.age < 42 && g.cit(c.spouse)?.alive); if (!a) return false; ctx.a = a.id; },
    text: (g, ctx) => `Giữa đêm mưa, ${N(g, ctx.a)} sinh một bé gái. Đứa trẻ đầu tiên chào đời ở Trạm Bơm Số 7.`,
    choices: [
      { label: 'Đặt tên bé là "Mầm"', run: (g) => { g.addCitizen({ name: 'Mầm', age: 0, gender: 'f', traits: ['optimist'] }); g.hope(8); g.chron('Bé Mầm chào đời.'); return '+8 Hy Vọng. Cả trạm thức đến sáng.'; } },
      { label: 'Đặt tên bé là "Lửa"', run: (g) => { g.addCitizen({ name: 'Lửa', age: 0, gender: 'f', traits: ['brave'] }); g.hope(8); g.chron('Bé Lửa chào đời.'); return '+8 Hy Vọng.'; } },
    ],
  },
];

// ================= CẢNH THÁM HIỂM =================
// ctx.mult: hệ số chiến lợi phẩm (mặc định 1)
const teamHurt = (g, n) => { const t = g.team(); if (t.length) { const c = g.pick(t); g.hurt(c, n); return c.name; } return ''; };

export const SCENES = {
  bamboo: [
    { id: 'bamboo_quiet', title: 'Rừng tre', art: 'forest',
      text: 'Gió lùa qua rừng tre nghe như tiếng ai thở dài. Đội chặt được kha khá tre, và có người còn phát hiện một tổ ong rừng.',
      choices: [
        { label: 'Lấy mật ong', check: { skill: 'farm', base: 45 },
          ok: (g, ctx) => { g.res('food', 4); g.res('medicine', 1); ctx.mult = 1; return 'Mật ong rừng! +4 Thực phẩm, +1 Thuốc.'; },
          fail: (g, ctx) => { ctx.mult = 0.8; return `Ong đốt ${teamHurt(g, 10)} sưng vù cả mặt.`; } },
        { label: 'Chỉ chặt tre rồi về', run: (g, ctx) => { ctx.mult = 1.1; return 'Một chuyến đi êm ả.'; } },
      ] },
    { id: 'bamboo_snake', title: 'Rắn trong tre', art: 'forest',
      text: 'Một con rắn hổ mang to bằng cổ tay ngóc đầu chắn ngay lối đi.',
      choices: [
        { label: 'Bắt nó', check: { skill: 'fight', base: 35 }, ok: (g, ctx) => { g.res('food', 3); ctx.mult = 1; return 'Tối nay có cháo rắn. +3 Thực phẩm.'; }, fail: (g, ctx) => { ctx.mult = 0.7; return `${teamHurt(g, 30)} bị rắn cắn, đội phải khiêng về.`; } },
        { label: 'Đi đường vòng', run: (g, ctx) => { ctx.mult = 0.8; return 'Mất thêm thời gian, chặt được ít tre hơn.'; } },
      ] },
  ],
  mall: [
    { id: 'mall_flood', title: 'Siêu thị ngập', art: 'ruins',
      text: 'Nước đen ngập đến thắt lưng. Đèn pin quét qua những kệ hàng đổ nghiêng. Ở sâu bên trong là quầy đồ hộp, nhưng mặt nước gợn sóng như có gì đang bơi.',
      choices: [
        { label: 'Lội vào quầy đồ hộp', check: { skill: 'scout', base: 40 },
          ok: (g, ctx) => { ctx.mult = 1.5; return 'Chỉ là một đàn cá lóc. Đội vét sạch quầy đồ hộp.'; },
          fail: (g, ctx) => { ctx.mult = 0.8; return `Một con kỳ đà khổng lồ quẫy nước. ${teamHurt(g, 20)} bị cào rách chân.`; } },
        { label: 'Lục khu điện máy trên tầng lửng', run: (g, ctx) => { ctx.mult = 1; g.res('parts', 1); return 'Tầng lửng khô ráo. Tháo được vài bo mạch. +1 Linh kiện.'; } },
      ] },
    { id: 'mall_survivor', title: 'Người trong kho lạnh', art: 'ruins',
      text: 'Từ kho lạnh vọng ra tiếng gõ. Bên trong là một cô gái trẻ gầy gò, tay ôm khẩu súng săn. "Đừng lại gần!"',
      choices: [
        { label: 'Nói chuyện với cô ấy', check: { skill: 'talk', base: 40 },
          ok: (g, ctx) => { const c = g.addCitizen({ gender: 'f', skills: { fight: 6, scout: 5 } }); ctx.mult = 1; return `Cô tên ${c.name}, đã sống một mình ở đây hai năm. Cô đồng ý theo đội về trạm. +1 cư dân.`; },
          fail: (g, ctx) => { ctx.mult = 0.6; return 'Một phát súng nổ lên trần. Đội rút lui, chỉ kịp vơ ít đồ.'; } },
        { label: 'Để lại ít đồ ăn rồi đi', run: (g, ctx) => { g.res('food', -2); g.hope(1); ctx.mult = 1; return 'Đội để lại hai hộp cá rồi rời đi.'; } },
      ] },
  ],
  school: [
    { id: 'school_library', title: 'Thư viện phủ rêu', art: 'school',
      text: 'Rêu mọc kín các giá sách, nhưng phòng máy tính trên tầng ba còn kín gió. Một dãy ổ cứng nằm trong tủ sắt khóa chặt.',
      choices: [
        { label: 'Cạy tủ sắt', check: { skill: 'craft', base: 40 },
          ok: (g, ctx) => { ctx.mult = 1.6; if (g.chance(0.5)) g.codex('hoi_sinh_1'); return 'Tủ bật mở. Bên trong là cả kho dữ liệu của trường.'; },
          fail: (g, ctx) => { ctx.mult = 0.8; return 'Ổ khóa không chịu nhúc nhích. Đội gom được vài ổ cứng rơi vãi.'; } },
        { label: 'Lấy sách giáo khoa cho bọn trẻ', run: (g, ctx) => { g.hope(2); ctx.mult = 0.9; return 'Một chồng sách giáo khoa lớp 1 còn đọc được. +2 Hy Vọng.'; } },
      ] },
    { id: 'school_bell', title: 'Tiếng chuông', art: 'school',
      text: 'Khi đội bước vào sân trường, chiếc chuông đồng treo trên cây phượng tự nhiên ngân lên một tiếng. Không có gió.',
      choices: [
        { label: 'Tìm hiểu nguyên nhân', check: { skill: 'study', base: 35 },
          ok: (g, ctx) => { g.res('memory', 2); ctx.mult = 1; return 'Tro bám trên chuông rung lên theo nhiệt độ. Một hiện tượng đáng ghi lại. +2 Ký Ức.'; },
          fail: (g, ctx) => { ctx.mult = 1; g.moodAll(-1); return 'Không ai giải thích được. Cả đội về trong im lặng.'; } },
        { label: 'Làm xong việc rồi về nhanh', run: (g, ctx) => { ctx.mult = 1; return 'Đội không nán lại.'; } },
      ] },
  ],
  gas: [
    { id: 'gas_tanker', title: 'Xe bồn đổ', art: 'ruins',
      text: 'Chiếc xe bồn nằm nghiêng, bồn chứa còn kín. Bên trong có thể còn dầu, cũng có thể chỉ là khí độc.',
      choices: [
        { label: 'Mở van kiểm tra', check: { skill: 'craft', base: 35 },
          ok: (g, ctx) => { ctx.mult = 1.4; g.res('parts', 2); return 'Không có dầu, nhưng hệ thống bơm còn nguyên. +2 Linh kiện thêm.'; },
          fail: (g, ctx) => { ctx.mult = 0.7; return `Khí độc phụt ra. ${teamHurt(g, 25)} ngất xỉu, đội phải rút.`; } },
        { label: 'Chỉ tháo phụ tùng xe', run: (g, ctx) => { ctx.mult = 1; return 'An toàn là trên hết.'; } },
      ] },
    { id: 'gas_wolves', title: 'Dấu vết Bầy Sói', art: 'ruins',
      text: 'Đống lửa còn ấm. Vỏ lon bia và một lá cờ vẽ hình sói. Có người vừa ở đây.',
      choices: [
        { label: 'Lục soát kho của chúng', check: { skill: 'scout', base: 30 },
          ok: (g, ctx) => { ctx.mult = 1.6; g.rep('wolves', -5); return 'Đội lấy được kho đồ của Bầy Sói rồi rút êm.'; },
          fail: (g, ctx) => { ctx.mult = 0.5; g.rep('wolves', -10); return `Bị phát hiện! Đội chạy thục mạng, ${teamHurt(g, 20)} trúng đá.`; } },
        { label: 'Để lại lời nhắn hòa bình', run: (g, ctx) => { ctx.mult = 0.8; g.rep('wolves', 5); return 'Một gói muối và dòng chữ "Trạm Bơm chào hàng xóm".'; } },
      ] },
  ],
  hospital: [
    { id: 'hospital_guardian', title: 'Kẻ canh giữ tầng trệt', art: 'hospital',
      text: 'Hành lang tầng trệt phủ một lớp Tro dày, trong đó có những dấu chân không giống người. Ở cuối hành lang, một khối xám cao hai mét đang đứng quay lưng: một Hình Nhân Tro.',
      choices: [
        { label: 'Đánh lạc hướng bằng lửa', check: { skill: 'fight', base: 30 },
          ok: (g, ctx) => { ctx.mult = 1.5; return 'Hình Nhân bị ánh lửa hút đi. Đội lẻn vào kho dược.'; },
          fail: (g, ctx) => { ctx.mult = 0.4; const n = teamHurt(g, 30); const c = g.team().find((x) => x.name === n); if (c) g.ash(c, 20); return `Hình Nhân quay lại. ${n} bị nó quật ngã, người dính đầy Tro.`; } },
        { label: 'Leo cửa sổ lên tầng 2', check: { skill: 'scout', base: 40 },
          ok: (g, ctx) => { ctx.mult = 1.1; return 'Khoa nội tầng 2 còn tủ thuốc nguyên vẹn.'; },
          fail: (g, ctx) => { ctx.mult = 0.5; return `${teamHurt(g, 20)} trượt chân ngã từ tường xuống.`; } },
      ] },
    { id: 'hospital_ward', title: 'Phòng bệnh cuối hành lang', art: 'hospital',
      text: 'Phòng bệnh số 7 còn nguyên giường. Trên tường có hàng trăm vạch đếm ngày bằng bút bi, và một dòng chữ: "THUỐC Ở TẦNG HẦM. ĐỪNG ĐỂ NÓ NGHE THẤY."',
      choices: [
        { label: 'Xuống tầng hầm thật nhẹ nhàng', check: { skill: 'scout', base: 35 },
          ok: (g, ctx) => { ctx.mult = 1.8; return 'Kho thuốc dự trữ khẩn cấp! Đội về với túi nặng trĩu.'; },
          fail: (g, ctx) => { ctx.mult = 0.6; return 'Một tiếng động. Thứ gì đó cựa mình dưới bóng tối. Đội bỏ chạy.'; } },
        { label: 'Lục các phòng tầng trên', run: (g, ctx) => { ctx.mult = 0.9; return 'Vài vỉ thuốc rơi rớt.'; } },
      ] },
  ],
  floatmarket: [
    { id: 'market_trader', title: 'Người bán dạo', art: 'market',
      text: 'Trên một chiếc ghe mục có ông lão ngồi bán khô cá và rau muống. "Đổi gì cũng được," ông nói.',
      choices: [
        { label: 'Đổi phế liệu lấy đồ ăn', cost: { scrap: 6 }, run: (g, ctx) => { g.res('food', 10); ctx.mult = 0.8; return '+10 Thực phẩm.'; } },
        { label: 'Hỏi chuyện ông lão', check: { skill: 'talk', base: 40 },
          ok: (g, ctx) => { g.reveal('hospital'); g.reveal('ship'); ctx.mult = 1; return 'Ông kể về bệnh viện quận và con tàu mắc cạn ở cửa sông.'; },
          fail: (g, ctx) => { ctx.mult = 1; return 'Ông lão chỉ cười móm mém.'; } },
      ] },
    { id: 'market_sunk', title: 'Ghe chìm', art: 'market',
      text: 'Một chiếc ghe chở gạo chìm nửa thân. Khoang hàng còn kín, nhưng ghe có thể lật bất cứ lúc nào.',
      choices: [
        { label: 'Lặn xuống khoang hàng', check: { skill: 'scout', base: 35 },
          ok: (g, ctx) => { ctx.mult = 1.7; return 'Mười bao gạo khô ráo trong khoang kín!'; },
          fail: (g, ctx) => { ctx.mult = 0.6; return `Ghe nghiêng, ${teamHurt(g, 15)} bị kẹt chân dưới nước một lúc lâu.`; } },
        { label: 'Lấy gỗ ghe làm củi', run: (g, ctx) => { g.res('wood', 6); ctx.mult = 0.8; return '+6 Tre gỗ.'; } },
      ] },
  ],
  tower: [
    { id: 'tower_climb', title: 'Tháp truyền hình', art: 'tower',
      text: (g) => `Tháp cao chót vót, Tro bám dày như tuyết trên từng thanh giằng. Ở tầng kỹ thuật lưng chừng tháp có ánh sáng le lói.${g.f('khang_promise') ? '\n\nKhang nhìn lên, môi mím chặt.' : ''}`,
      choices: [
        { label: 'Leo lên tầng kỹ thuật', check: { skill: 'scout', base: 25 },
          ok: (g, ctx) => {
            ctx.mult = 1.4;
            if (g.f('khang_promise') && !g.f('hoa_found')) {
              g.flag('hoa_found');
              const hoa = g.addCitizen({ name: 'Hoa', gender: 'f', age: 19, skills: { study: 7, craft: 5 }, traits: ['hardworker'] });
              const k = g.cit('khang'); if (k) g.mood(k, 40);
              g.hope(6); g.chron('Khang tìm thấy em gái Hoa ở tháp truyền hình.');
              return `Trên tầng kỹ thuật có một nhóm nhỏ sống bằng điện mặt trời, và ${hoa.name} ở trong số đó. Khang ôm chầm lấy em, khóc như một đứa trẻ. ${hoa.name} gia nhập trạm. +6 Hy Vọng.`;
            }
            return 'Tầng kỹ thuật bỏ hoang, nhưng hệ thống máy phát sóng còn nhiều linh kiện quý.';
          },
          fail: (g, ctx) => { ctx.mult = 0.4; const n = teamHurt(g, 35); return `Thanh giằng gãy. ${n} rơi xuống tầng dưới, gãy chân.`; } },
        { label: 'Lục phòng máy dưới chân tháp', run: (g, ctx) => { ctx.mult = 0.8; return 'Phòng máy dưới chân tháp vẫn còn đồ.'; } },
      ] },
  ],
  ship: [
    { id: 'ship_hold', title: 'Hầm tàu', art: 'ship',
      text: 'Con tàu nghiêng 20 độ. Hàng trăm container mở toang, một số còn niêm phong nguyên vẹn, in logo của một tập đoàn không còn tồn tại.',
      choices: [
        { label: 'Phá niêm phong container', check: { skill: 'craft', base: 35 },
          ok: (g, ctx) => { ctx.mult = 1.5; return 'Linh kiện điện tử còn nguyên trong túi chống ẩm!'; },
          fail: (g, ctx) => { ctx.mult = 0.8; return 'Chỉ toàn quần áo mốc meo.'; } },
        { label: 'Tìm phòng thuyền trưởng', check: { skill: 'scout', base: 40 },
          ok: (g, ctx) => { g.res('memory', 3); ctx.mult = 1; return 'Nhật ký hành trình ghi lại những ngày cuối cùng trước Đêm Tro. +3 Ký Ức.'; },
          fail: (g, ctx) => { ctx.mult = 0.9; return 'Phòng thuyền trưởng đã ngập nước.'; } },
      ] },
    { id: 'ship_crabs', title: 'Đàn cua thép', art: 'ship',
      text: 'Boong tàu lúc nhúc những con cua to bằng cái nón, vỏ ánh kim loại vì ăn Tro lâu năm.',
      choices: [
        { label: 'Bắt cua', check: { skill: 'fight', base: 35 }, ok: (g, ctx) => { g.res('food', 8); ctx.mult = 1; return '+8 Thực phẩm. Thịt cua ngọt lạ lùng.'; }, fail: (g, ctx) => { ctx.mult = 0.8; return `${teamHurt(g, 15)} bị càng cua kẹp rách tay.`; } },
        { label: 'Né sang mạn tàu bên kia', run: (g, ctx) => { ctx.mult = 0.9; return 'Mất chút thời gian.'; } },
      ] },
  ],
};
