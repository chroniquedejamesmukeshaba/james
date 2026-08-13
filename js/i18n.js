// ===== i18n SYSTEM =====
var LANGUAGES = { fr:'Fran\u00e7ais', en:'English', sw:'Kiswahili', es:'Espa\u00f1ol', zh:'中文', ln:'Lingála' };
var LANG_KEYS = ['fr','en','sw','es','zh','ln'];

var TRANSLATIONS = {
  // === NAVIGATION ===
  nav_accueil:        { fr:'Accueil', en:'Home', sw:'Nyumbani', es:'Inicio', zh:'首页', ln:'Ebandeli'},
  nav_actualites:     { fr:'Actualit\u00e9s', en:'News', sw:'Habari', es:'Noticias', zh:'新闻', ln:'Bikambo'},
  nav_qui_sommes_nous:{ fr:'Qui sommes-nous', en:'About Us', sw:'Sisi ni nani', es:'Qui\u00e9nes somos', zh:'关于我们', ln:'Biso tozali nani'},
  nav_projets:        { fr:'Projets', en:'Projects', sw:'Miradi', es:'Proyectos', zh:'项目', ln:'Misala'},
  nav_sensibilisation:{ fr:'Sensibilisation', en:'Awareness', sw:'Uhamasishaji', es:'Concienciaci\u00f3n', zh:'宣传倡导', ln:'Bokengi'},
  nav_objets_perdus:  { fr:'Objets perdus', en:'Lost & Found', sw:'Vitu vilivyopotea', es:'Objetos perdidos', zh:'失物招领', ln:'Biloko ebungaki'},
  nav_heritage:       { fr:'H\u00e9ritage', en:'Heritage', sw:'Urithi', es:'Patrimonio', zh:'文化遗产', ln:'Libulisi'},
  nav_faq:            { fr:'FAQ', en:'FAQ', sw:'Maswali', es:'Preguntas', zh:'常见问题', ln:'Batikisi ya mbala mingi'},
  nav_donation:       { fr:'Donation', en:'Donate', sw:'Mchango', es:'Donar', zh:'支持我们', ln:'Bosungi'},
  nav_soutenir:       { fr:'Soutenir', en:'Support', sw:'Msaada', es:'Apoyar', zh:'支持', ln:'Bosungi'},

  // === LOGO / TAGLINE ===
  logo_title:         { fr:'Chronique de James Mukeshaba', en:'James Mukeshaba Chronicle', sw:'Chronicle ya James Mukeshaba', es:'Cr\u00f3nica de James Mukeshaba', zh:'詹姆斯·穆克沙巴纪事报', ln:'Kroniki ya James Mukeshaba'},
  logo_tagline:       { fr:'Informations \u2022 Sensibilisation \u2022 Projets', en:'News \u2022 Awareness \u2022 Projects', sw:'Habari \u2022 Uhamasishaji \u2022 Miradi', es:'Noticias \u2022 Concienciaci\u00f3n \u2022 Proyectos', zh:'信息 · 宣传 · 项目', ln:'Bikambo • Bokengi • Misala'},

  // === HERO SLIDER ===
  hero_read_article:  { fr:'Lire l\'article', en:'Read article', sw:'Soma makala', es:'Leer art\u00edculo', zh:'阅读文章', ln:'Tangá makambo'},

  // === MISSION ===
  mission_title:      { fr:'Notre Mission', en:'Our Mission', sw:'Dhamira yetu', es:'Nuestra Misi\u00f3n', zh:'我们的使命', ln:'Mokano na biso'},
  mission_text:       { fr:'Informer, sensibiliser et mobiliser les communaut\u00e9s congolaises en RDC et dans la diaspora. La Chronique de James Mukeshaba est votre source d\'information fiable pour un monde meilleur.', en:'Inform, raise awareness and mobilize Congolese communities in the DRC and diaspora. James Mukeshaba Chronicle is your reliable news source for a better world.', sw:'Kuwaarifu, kuhamasisha na kuhamasisha jamii za Kongo katika DRC na diaspora. Chronicle ya James Mukeshaba ni chanzo chako cha habari cha kuaminika kwa ulimwengu bora.', es:'Informar, sensibilizar y movilizar a las comunidades congole\u00f1as en la RDC y la di\u00e1spora. La Cr\u00f3nica de James Mukeshaba es su fuente de informaci\u00f3n confiable para un mundo mejor.', zh:'向公众提供可信、独立的信息，推动宣传行动和社区项目，为更好的社会而行动。', ln:'Kopesa bato mikanda ya solo mpe ya libela, kosakola mpe kosala misala ya lisanga mpo na bomoi malamu.'},
  mission_sign:       { fr:'\u2014 <strong>James Mukeshaba</strong>, Coordonnateur principal', en:'\u2014 <strong>James Mukeshaba</strong>, Chief Coordinator', sw:'\u2014 <strong>James Mukeshaba</strong>, Mratibu Mkuu', es:'\u2014 <strong>James Mukeshaba</strong>, Coordinador Principal', zh:'詹姆斯·穆克沙巴', ln:'James Mukeshaba'},

  // === CAMPAIGN CAROUSEL ===
  campaign_title:     { fr:'Campagnes en cours', en:'Active Campaigns', sw:'Kampeni zinazoendelea', es:'Campa\u00f1as activas', zh:'正在进行的活动', ln:'Mikampani oyo ezali kosalema'},
  campaign_empty:     { fr:'Aucune campagne en cours.', en:'No active campaigns.', sw:'Hakuna kampeni zinazoendelea.', es:'No hay campa\u00f1as activas.', zh:'暂时没有活动。', ln:'Kampani moko te lelo.'},

  // === ARTICLES ===
  latest_news:        { fr:'Derni\u00e8res Actualit\u00e9s', en:'Latest News', sw:'Habari za hivi punde', es:'\u00daltimas Noticias', zh:'最新新闻', ln:'Bikambo ya sika'},
  view_all_news:      { fr:'Voir toutes les actualit\u00e9s', en:'View all news', sw:'Tazama habari zote', es:'Ver todas las noticias', zh:'查看全部新闻', ln:'Tala makambo nyonso'},
  all_news:           { fr:'Actualit\u00e9s', en:'All News', sw:'Habari zote', es:'Todas las noticias', zh:'全部新闻', ln:'Bikambo nyonso'},

  // === NEWSLETTER ===
  newsletter_title:   { fr:'Restez inform\u00e9', en:'Stay informed', sw:'Kaa na habari', es:'Mant\u00e9ngase informado', zh:'订阅我们的通讯', ln:'Bókomisa sango na yó'},
  newsletter_desc:    { fr:'Abonnez-vous \u00e0 notre newsletter et recevez les derni\u00e8res actualit\u00e9s directement dans votre bo\u00eete mail.', en:'Subscribe to our newsletter and receive the latest news directly in your inbox.', sw:'Jisajili kwa jarida letu na upokee habari za hivi punde moja kwa moja kwenye kikasha chako.', es:'Suscr\u00edbase a nuestro bolet\u00edn y reciba las \u00faltimas noticias directamente en su bandeja de entrada.', zh:'直接在邮箱中接收最新新闻。', ln:'Zwa makambo ya sika kaka na adrese email na yó.'},
  newsletter_placeholder:{ fr:'Votre adresse email', en:'Your email address', sw:'Barua pepe yako', es:'Su correo electr\u00f3nico', zh:'您的邮箱地址', ln:'Adrese email na yó'},
  newsletter_button:  { fr:'S\'abonner', en:'Subscribe', sw:'Jisajili', es:'Suscribirse', zh:'订阅', ln:'Kokomisa sango'},

  // === PAGE HEADERS ===
  page_title_actualites:   { fr:'Actualit\u00e9s', en:'News', sw:'Habari', es:'Noticias', zh:'新闻', ln:'Bikambo'},
  page_subtitle_actualites:{ fr:'Retrouvez toute l\'actualit\u00e9 de la Chronique de James Mukeshaba', en:'All the latest from James Mukeshaba Chronicle', sw:'Habari zote kutoka Chronicle ya James Mukeshaba', es:'Todas las \u00faltimas noticias de la Cr\u00f3nica de James Mukeshaba', zh:'关于刚果和世界各地的最新消息。', ln:'Makambo ya sika ya Kongó mpe ya mokili mobimba.'},

  // === ARTICLE DETAIL ===
  share_title:        { fr:'Partager cet article :', en:'Share this article:', sw:'Shiriki makala hii:', es:'Compartir este art\u00edculo:', zh:'分享', ln:'Kokabola'},
  share_facebook:     { fr:'Facebook', en:'Facebook', sw:'Facebook', es:'Facebook', zh:'在 Facebook 上分享', ln:'Kokabola na Facebook'},
  share_whatsapp:     { fr:'WhatsApp', en:'WhatsApp', sw:'WhatsApp', es:'WhatsApp', zh:'在 WhatsApp 上分享', ln:'Kokabola na WhatsApp'},
  share_x:            { fr:'X', en:'X', sw:'X', es:'X', zh:'在 X (Twitter) 上分享', ln:'Kokabola na X (Twitter)'},
  share_linkedin:     { fr:'LinkedIn', en:'LinkedIn', sw:'LinkedIn', es:'LinkedIn', zh:'在 LinkedIn 上分享', ln:'Kokabola na LinkedIn'},
  share_copy:         { fr:'Copier le lien', en:'Copy link', sw:'Nakili kiungo', es:'Copiar enlace', zh:'复制链接', ln:'Kokópa lien'},
  comments_title:     { fr:'Commentaires', en:'Comments', sw:'Maoni', es:'Comentarios', zh:'评论', ln:'Makomi ya bato'},
  comment_form_title: { fr:'Laisser un commentaire', en:'Leave a comment', sw:'Acha maoni', es:'Dejar un comentario', zh:'发表评论', ln:'Kokoma makanisi na yó'},
  comment_name_placeholder:{ fr:'Votre nom', en:'Your name', sw:'Jina lako', es:'Su nombre', zh:'您的姓名', ln:'Kombo na yó'},
  comment_text_placeholder:{ fr:'Votre commentaire...', en:'Your comment...', sw:'Maoni yako...', es:'Su comentario...', zh:'您的评论…', ln:'Makanisi na yó…'},
  comment_submit:     { fr:'Publier le commentaire', en:'Publish comment', sw:'Chapisha maoni', es:'Publicar comentario', zh:'发送', ln:'Tinda'},
  content_unavailable:{ fr:'Contenu non disponible.', en:'Content not available.', sw:'Maudhui hayapatikani.', es:'Contenido no disponible.', zh:'内容不可用。', ln:'Makambo ya sika ezali te.'},
  article_by:         { fr:'Par', en:'By', sw:'Na', es:'Por', zh:'作者', ln:'Mokomi'},
  no_comments:        { fr:'Aucun commentaire pour le moment. Soyez le premier \u00e0 commenter !', en:'No comments yet. Be the first to comment!', sw:'Hakuna maoni kwa sasa. Kuwa wa kwanza kutoa maoni!', es:'No hay comentarios todav\u00eda. \u00a1S\u00e9 el primero en comentar!', zh:'还没有评论。', ln:'Makanisi moko te liboso.'},

  // === FOOTER ===
  footer_pages:       { fr:'Pages', en:'Pages', sw:'Kurasa', es:'P\u00e1ginas', zh:'页面', ln:'Bilakisi'},
  footer_contact:     { fr:'Contact', en:'Contact', sw:'Mawasiliano', es:'Contacto', zh:'联系', ln:'Boyokani'},
  footer_admin:       { fr:'Administration', en:'Administration', sw:'Usimamizi', es:'Administraci\u00f3n', zh:'管理', ln:'Administration'},
  footer_address:     { fr:'Bukavu, Sud-Kivu, RDC', en:'Bukavu, South Kivu, DRC', sw:'Bukavu, Kivu Kusini, DRC', es:'Bukavu, Kivu del Sur, RDC', zh:'刚果民主共和国南基伍省布卡武', ln:'Bukavu, Sud-Kivu, RDC'},
  footer_phone_rdc:   { fr:'+243 971460415', en:'+243 971460415', sw:'+243 971460415', es:'+243 971460415', zh:'+243 971460415', ln:'+243 971460415'},
  footer_phone_canada:{ fr:'+1 (825) 449-0187 (Canada)', en:'+1 (825) 449-0187 (Canada)', sw:'+1 (825) 449-0187 (Kanada)', es:'+1 (825) 449-0187 (Canad\u00e1)', zh:'+1 (825) 449-0187（加拿大）', ln:'+1 (825) 449-0187 (Kanada)'},
  footer_admin_link:  { fr:'Espace administrateur', en:'Admin area', sw:'Eneo la usimamizi', es:'\u00c1rea de administraci\u00f3n', zh:'管理后台', ln:'Esika ya administrasio'},
  footer_description: { fr:'M\u00e9dia d\'information en ligne, sensibilisation et projets communautaires.', en:'Online news media, awareness and community projects.', sw:'Vyombo vya habari mtandaoni, uhamasishaji na miradi ya jamii.', es:'Medio de noticias en l\u00ednea, concientizaci\u00f3n y proyectos comunitarios.', zh:'在线新闻媒体，从事宣传倡导和社区项目。总部位于布卡武，业务遍及国际。', ln:'Mazíki ya sango na Internet, bokengi mpe misala ya lisanga. Ebóyi na Bukavu, mpe mosala mokili mobimba.'},
  pwa_install:        { fr:'\ud83d\udcf2 Installer l\'application', en:'\ud83d\udcf2 Install the app', sw:'\ud83d\udcf2 Sakinisha programu', es:'\ud83d\udcf2 Instalar la aplicaci\u00f3n', zh:'📱 安装应用', ln:'📱 Líla aplikasi'},
  copyright:          { fr:'\u00a9 2026 Chronique de James Mukeshaba. Tous droits r\u00e9serv\u00e9s.', en:'\u00a9 2026 James Mukeshaba Chronicle. All rights reserved.', sw:'\u00a9 2026 Chronicle ya James Mukeshaba. Haki zote zimehifadhiwa.', es:'\u00a9 2026 Cr\u00f3nica de James Mukeshaba. Todos los derechos reservados.', zh:'© 2026 詹姆斯·穆克沙巴纪事报。保留所有权利。', ln:'© 2026 Kroniki ya James Mukeshaba. Makoki nyonso ebombami.'},

  // === BREADCRUMB ===
  breadcrumb_home:    { fr:'Accueil', en:'Home', sw:'Nyumbani', es:'Inicio', zh:'首页', ln:'Ebandeli'},
  breadcrumb_actualites:{ fr:'Actualit\u00e9s', en:'News', sw:'Habari', es:'Noticias', zh:'新闻', ln:'Bikambo'},
  breadcrumb_article: { fr:'Article', en:'Article', sw:'Makala', es:'Art\u00edculo', zh:'文章', ln:'Mokanda'},

  // === DONATION ===
  donation_title:     { fr:'Soutenez notre M\u00e9dia', en:'Support Our Media', sw:'Tegemea Vyombo vyetu vya Habari', es:'Apoye Nuestro Medio', zh:'支持我们的行动', ln:'Sunga misala na biso'},
  donation_subtitle:  { fr:'Votre don finance nos projets et notre ind\u00e9pendance', en:'Your donation funds our projects and independence', sw:'Mchango wako unafadhili miradi yetu na uhuru wetu', es:'Su donaci\u00f3n financia nuestros proyectos e independencia', zh:'您的捐款直接支持我们的信息与社区行动。', ln:'Bopesi na yó esunga misala na biso ya sango mpe ya lisanga.'},
  donation_make:      { fr:'Faire un Don', en:'Make a Donation', sw:'Toa Mchango', es:'Hacer una Donaci\u00f3n', zh:'捐款', ln:'Kopesa makabo'},
  donation_desc:      { fr:'Chaque contribution, grande ou petite, nous aide \u00e0 continuer notre mission d\'information et de sensibilisation.', en:'Every contribution, big or small, helps us continue our mission of information and awareness.', sw:'Kila mchango, mkubwa au mdogo, unatusaidia kuendeleza dhamira yetu ya habari na uhamasishaji.', es:'Cada contribuci\u00f3n, grande o peque\u00f1a, nos ayuda a continuar nuestra misi\u00f3n de informaci\u00f3n y concienciaci\u00f3n.', zh:'选择捐款金额：', ln:'Póná motuya ya makabo na yó:'},
  donation_custom:    { fr:'Libre', en:'Custom', sw:'Bure', es:'Libre', zh:'自定义金额', ln:'Motuya ya moké'},
  donation_amount_ph: { fr:'Montant personnalis\u00e9', en:'Custom amount', sw:'Kiasi maalum', es:'Cantidad personalizada', zh:'输入金额（美元）', ln:'Koma motuya (USD)'},
  donation_name_label:{ fr:'Nom complet', en:'Full name', sw:'Jina kamili', es:'Nombre completo', zh:'姓名', ln:'Kombo'},
  donation_name_ph:   { fr:'Votre nom', en:'Your name', sw:'Jina lako', es:'Su nombre', zh:'您的姓名', ln:'Kombo na yó'},
  donation_email_label:{ fr:'Email', en:'Email', sw:'Barua pepe', es:'Correo electr\u00f3nico', zh:'邮箱', ln:'Email'},
  donation_email_ph:  { fr:'Votre email', en:'Your email', sw:'Barua pepe yako', es:'Su correo', zh:'您的邮箱地址', ln:'Adrese email na yó'},
  donation_submit:    { fr:'Faire un don s\u00e9curis\u00e9', en:'Make a secure donation', sw:'Toa mchango salama', es:'Hacer una donaci\u00f3n segura', zh:'捐赠', ln:'Kopesa makabo'},
  donation_secure:    { fr:'\ud83d\udd12 Paiement s\u00e9curis\u00e9. Votre don sera trait\u00e9 en toute s\u00e9curit\u00e9.', en:'\ud83d\udd12 Secure payment. Your donation will be processed safely.', sw:'\ud83d\udd12 Malipo salama. Mchango wako utashughulikiwa kwa usalama.', es:'\ud83d\udd12 Pago seguro. Su donaci\u00f3n ser\u00e1 procesada de forma segura.', zh:'🔒 安全支付', ln:'🔒 Lípaya ya libateli'},

  // === LOST & FOUND ===
  lf_title:           { fr:'Objets Perdus et Trouv\u00e9s', en:'Lost & Found', sw:'Vitu Vilivyopotea na Kupatikana', es:'Objetos Perdidos y Encontrados', zh:'失物招领', ln:'Biloko ebungaki'},
  lf_subtitle:        { fr:'Espace communautaire d\'entraide', en:'Community help space', sw:'Nafasi ya usaidizi wa jamii', es:'Espacio comunitario de ayuda', zh:'发布丢失或找到的物品。', ln:'Sakola biloko oyo ebungaki to oyo ezwami.'},
  lf_intro:           { fr:'D\u00e9clarez un objet perdu ou trouv\u00e9 pour aider la communaut\u00e9.', en:'Report a lost or found item to help the community.', sw:'Ripoti kitu kilichopotea au kupatikana kusaidia jamii.', es:'Reporte un objeto perdido o encontrado para ayudar a la comunidad.', zh:'丢失或找到了物品？在此发布公告。', ln:'Ebungaki to ezwami eloko? Sakola awa.'},
  lf_publish:         { fr:'+ Publier une annonce', en:'+ Publish an ad', sw:'+ Chapisha tangazo', es:'+ Publicar un anuncio', zh:'发布公告', ln:'Kobimisa sakola'},
  lf_form_title:      { fr:'Nouvelle annonce', en:'New ad', sw:'Tangazo jipya', es:'Nuevo anuncio', zh:'新公告', ln:'Sakola ya sika'},
  lf_type_label:      { fr:'Type d\'annonce', en:'Ad type', sw:'Aina ya tangazo', es:'Tipo de anuncio', zh:'类型', ln:'Lolenge'},
  lf_type_lost:       { fr:'Objet perdu', en:'Lost item', sw:'Kitu kilichopotea', es:'Objeto perdido', zh:'丢失', ln:'Ebungaki'},
  lf_type_found:      { fr:'Objet trouv\u00e9', en:'Found item', sw:'Kitu kilichopatikana', es:'Objeto encontrado', zh:'找到', ln:'Ezwami'},
  lf_item_label:      { fr:'Objet', en:'Item', sw:'Kitu', es:'Objeto', zh:'物品名称', ln:'Kombo ya eloko'},
  lf_item_ph:         { fr:'Nom de l\'objet', en:'Item name', sw:'Jina la kitu', es:'Nombre del objeto', zh:'例如：证件、手机…', ln:'Móndima: carte, telefóne…'},
  lf_desc_label:      { fr:'Description', en:'Description', sw:'Maelezo', es:'Descripci\u00f3n', zh:'描述', ln:'Lisoló'},
  lf_desc_ph:         { fr:'Description d\u00e9taill\u00e9e, lieu, date...', en:'Detailed description, location, date...', sw:'Maelezo ya kina, mahali, tarehe...', es:'Descripci\u00f3n detallada, lugar, fecha...', zh:'描述物品特征…', ln:'Loba ndenge eloko ezali…'},
  lf_contact_label:   { fr:'Contact', en:'Contact', sw:'Mawasiliano', es:'Contacto', zh:'联系方式', ln:'Etelembo ya boyokani'},
  lf_contact_ph:      { fr:'T\u00e9l\u00e9phone ou email', en:'Phone or email', sw:'Simu au barua pepe', es:'Tel\u00e9fono o correo', zh:'电话或邮箱', ln:'Nimero to email'},
  lf_submit_btn:      { fr:'Publier l\'annonce', en:'Publish ad', sw:'Chapisha tangazo', es:'Publicar anuncio', zh:'发布', ln:'Kobimisa'},
  lf_cancel_btn:      { fr:'Annuler', en:'Cancel', sw:'Ghairi', es:'Cancelar', zh:'取消', ln:'Kolongola'},
  lf_status_lost:     { fr:'\ud83d\udd34 Perdu', en:'\ud83d\udd34 Lost', sw:'\ud83d\udd34 Imepotea', es:'\ud83d\udd34 Perdido', zh:'丢失', ln:'Ebungaki'},
  lf_status_found:    { fr:'\ud83d\udfe2 Trouv\u00e9', en:'\ud83d\udfe2 Found', sw:'\ud83d\udfe2 Imepatikana', es:'\ud83d\udfe2 Encontrado', zh:'找到', ln:'Ezwami'},

  // === FAQ ===
  faq_title:          { fr:'Questions Fr\u00e9quentes', en:'Frequently Asked Questions', sw:'Maswali Yanayoulizwa Mara kwa Mara', es:'Preguntas Frecuentes', zh:'常见问题', ln:'Batikisi ya mbala mingi'},
  faq_subtitle:       { fr:'Tout ce que vous devez savoir sur la Chronique de James Mukeshaba', en:'Everything you need to know about James Mukeshaba Chronicle', sw:'Kila kitu unachohitaji kujua kuhusu Chronicle ya James Mukeshaba', es:'Todo lo que necesita saber sobre la Cr\u00f3nica de James Mukeshaba', zh:'回答最常见的问题。', ln:'Bilongiseli ya mituna oyo batu batunaka mingi.'},

  // === HERITAGE ===
  heritage_title:     { fr:'H\u00e9ritage', en:'Heritage', sw:'Urithi', es:'Patrimonio', zh:'文化遗产', ln:'Libulisi'},
  heritage_subtitle:  { fr:'Archives, culture et m\u00e9moires du Congo', en:'Archives, culture and memories of Congo', sw:'Kumbukumbu, utamaduni na kumbukumbu za Kongo', es:'Archivos, cultura y memorias del Congo', zh:'我们的文化宝藏。', ln:'Bomengo na biso ya bonkɔkɔ.'},

  // === PROJECTS ===
  projects_title:     { fr:'Nos Projets', en:'Our Projects', sw:'Miradi Yetu', es:'Nuestros Proyectos', zh:'项目', ln:'Misala'},
  projects_subtitle:  { fr:'Des initiatives qui transforment nos communaut\u00e9s', en:'Initiatives transforming our communities', sw:'Mipango inayobadilisha jamii zetu', es:'Iniciativas que transforman nuestras comunidades', zh:'我们的社区项目。', ln:'Misala na biso ya lisanga.'},

  // === ABOUT ===
  about_title:        { fr:'Qui sommes-nous', en:'About Us', sw:'Sisi ni nani', es:'Qui\u00e9nes somos', zh:'关于我们', ln:'Biso tozali nani'},
  about_subtitle:     { fr:'Une institution m\u00e9diatique ind\u00e9pendante et engag\u00e9e', en:'An independent and committed media institution', sw:'Taasisi ya vyombo vya habari huru na inayojitolea', es:'Una instituci\u00f3n medi\u00e1tica independiente y comprometida', zh:'了解我们的团队和使命。', ln:'Yéba lisanga mpe mokano na biso.'},

  // === SENSIBILISATION ===
  sensibilisation_title:    { fr:'Sensibilisation', en:'Awareness', sw:'Uhamasishaji', es:'Concienciaci\u00f3n', zh:'宣传倡导', ln:'Bokengi'},
  sensibilisation_subtitle: { fr:'Des campagnes pour un impact social durable', en:'Campaigns for lasting social impact', sw:'Kampeni za athari za kijamii za kudumu', es:'Campa\u00f1as para un impacto social duradero', zh:'提高对重要议题的认识。', ln:'Kobongola makanisi ya bato na makambo ya ntina.'},
  sensibilisation_archived: { fr:'Campagnes archiv\u00e9es', en:'Archived Campaigns', sw:'Kampeni zilizohifadhiwa', es:'Campa\u00f1as archivadas', zh:'已归档文章', ln:'Makomi oyo ebombami'},
  sensibilisation_no_archived: { fr:'Aucune campagne archiv\u00e9e pour le moment.', en:'No archived campaigns for now.', sw:'Hakuna kampeni zilizohifadhiwa kwa sasa.', es:'No hay campa\u00f1as archivadas por ahora.', zh:'没有已归档的文章。', ln:'Mokanda moko te oyo ebombami.'},

  // === COMMUNS ===
  categories:         { fr:'Cat\u00e9gories', en:'Categories', sw:'Kategoria', es:'Categor\u00edas', zh:'分类', ln:'Bibongoli'},
  nav_categories:     { fr:'Cat\u00e9gories', en:'Categories', sw:'Kategoria', es:'Categor\u00edas', zh:'分类', ln:'Bibongoli'},
  prev_article:       { fr:'Article pr\u00e9c\u00e9dent', en:'Previous article', sw:'Makala iliyotangulia', es:'Art\u00edculo anterior', zh:'上一篇', ln:'Makomi oyo eleki'},
  next_article:       { fr:'Article suivant', en:'Next article', sw:'Makala ijayo', es:'Art\u00edculo siguiente', zh:'下一篇', ln:'Makomi oyo elandi'},
  related_title:      { fr:'\u00c0 lire ensuite', en:'Read next', sw:'Soma ijayo', es:'Siga leyendo', zh:'接下来阅读', ln:'Tanga oyo elandi'},

  // === HOME MODERNE ===
  home_breaking:      { fr:'Derni\u00e8re heure', en:'Breaking News', sw:'Habari za mwisho', es:'\u00daltima hora', zh:'突发新闻', ln:'Sango ya suki'},
  home_alaune:        { fr:'\u00c0 la Une', en:'Top Stories', sw:'Habari kuu', es:'Portada', zh:'头条新闻', ln:'Makambo ya liboso'},
  home_ads:           { fr:'Espace publicitaire', en:'Advertising', sw:'Nafasi ya matangazo', es:'Espacio publicitario', zh:'广告位', ln:'Esika ya panzela'},
  ad_cta:             { fr:'VOTRE PUBLICIT\u00c9', en:'YOUR ADVERT', sw:'TANGAZO LAKO', es:'SU PUBLICIDAD', zh:'您的广告', ln:'PANZELA NA YO'},
  admin_login:        { fr:'Connexion', en:'Login', sw:'Ingia', es:'Iniciar sesi\u00f3n', zh:'\u767b\u5f55', ln:'Kokota'},
  home_ads_empty:     { fr:'Votre publicit\u00e9 pourrait s\u2019afficher ici.', en:'Your advert could be displayed here.', sw:'Tangazo lako linaweza kuonyeshwa hapa.', es:'Su publicidad podr\u00eda mostrarse aqu\u00ed.', zh:'您的广告可以显示在这里。', ln:'Panzela na yo ekoki komonana awa.'},
  home_latest:        { fr:'Derni\u00e8res actualit\u00e9s', en:'Latest News', sw:'Habari za hivi punde', es:'\u00daltimas noticias', zh:'最新新闻', ln:'Makambo ya sika'},
  home_view_more:     { fr:'Voir plus', en:'View more', sw:'Tazama zaidi', es:'Ver m\u00e1s', zh:'查看更多', ln:'Tala mosusu'},
  home_support:       { fr:'Soutenir nos actions', en:'Support our actions', sw:'Tunga mkono shughuli zetu', es:'Apoyar nuestras acciones', zh:'支持我们的行动', ln:'Sunga misala na biso'},
  wa_channel:         { fr:'Rejoindre notre cha\u00eene WhatsApp', en:'Join our WhatsApp channel', sw:'Jiunge na kituo chetu cha WhatsApp', es:'\u00danete a nuestro canal de WhatsApp', zh:'加入我们的WhatsApp频道', ln:'Kota na kanal na biso ya WhatsApp'},
  home_search_ph:     { fr:'Rechercher un article\u2026', en:'Search an article\u2026', sw:'Tafuta makala\u2026', es:'Buscar un art\u00edculo\u2026', zh:'搜索文章、主题、地点…', ln:'Boluka makomi, makambo, esika…'},
  home_search_hint:   { fr:'Tapez pour rechercher un article\u2026', en:'Type to search an article\u2026', sw:'Andika kutafuta makala\u2026', es:'Escriba para buscar un art\u00edculo\u2026', zh:'至少输入 2 个字符', ln:'Koma búku mibale to mingi'},
  home_search_none:   { fr:'Aucun r\u00e9sultat pour cette recherche.', en:'No results for this search.', sw:'Hakuna matokeo ya utafutaji huu.', es:'Sin resultados para esta b\u00fasqueda.', zh:'没有找到结果。', ln:'Ezwami eloko te.'},
  home_search_title:  { fr:'R\u00e9sultats', en:'Results', sw:'Matokeo', es:'Resultados', zh:'搜索结果', ln:'Bilukami'},

  // === ARTICLE MODERNE ===
  reading_time:       { fr:'Lecture', en:'Reading', sw:'Usomaji', es:'Lectura', zh:'阅读时间', ln:'Mingongo ya kotánga'},
  modified:           { fr:'Mis \u00e0 jour', en:'Updated', sw:'Imesasishwa', es:'Actualizado', zh:'修改', ln:'Ebóngwani'},
  priority_important: { fr:'Important', en:'Important', sw:'Muhimu', es:'Importante', zh:'重要', ln:'Ya ntina'},
  sources:            { fr:'Sources', en:'Sources', sw:'Vyanzo', es:'Fuentes', zh:'来源', ln:'Misúka'},
  report_comment:     { fr:'Signaler', en:'Report', sw:'Ripoti', es:'Reportar', zh:'举报评论', ln:'Koperta makanisi'},
  copied_link:        { fr:'Lien copi\u00e9 dans le presse-papiers.', en:'Link copied to clipboard.', sw:'Kiungo kimenakiliwa.', es:'Enlace copiado.', zh:'链接已复制到剪贴板。', ln:'Lien ekopí na clipboard.'},

  // === RECHERCHE & CATEGORIES ===
  sr_placeholder:     { fr:'Rechercher un article, une cat\u00e9gorie, un auteur\u2026', en:'Search an article, a category, an author\u2026', sw:'Tafuta makala, kategoria, mwandishi\u2026', es:'Buscar un art\u00edculo, una categor\u00eda, un autor\u2026', zh:'搜索文章…', ln:'Boluka makomi…'},
  sr_categories:      { fr:'Cat\u00e9gories', en:'Categories', sw:'Kategoria', es:'Categor\u00edas', zh:'类别', ln:'Biténi'},
  sr_recent:          { fr:'Derniers articles', en:'Latest articles', sw:'Makala za hivi punde', es:'\u00daltimos art\u00edculos', zh:'最近', ln:'Ya sika'},
  sr_popular:         { fr:'Les plus lus', en:'Most read', sw:'Zinazosomwa zaidi', es:'M\u00e1s le\u00eddos', zh:'热门', ln:'Ezalaki mingi'},
  sr_results:         { fr:'R\u00e9sultats', en:'Results', sw:'Matokeo', es:'Resultados', zh:'结果', ln:'Bilukami'},
  sr_all:             { fr:'Voir tous les r\u00e9sultats', en:'See all results', sw:'Ona matokeo yote', es:'Ver todos los resultados', zh:'全部', ln:'Nyonso'},
  sr_none:            { fr:'Aucun r\u00e9sultat pour cette recherche.', en:'No results for this search.', sw:'Hakuna matokeo ya utafutaji huu.', es:'Sin resultados para esta b\u00fasqueda.', zh:'无结果', ln:'Eloko moko te'},
  sr_hint:            { fr:'Tapez au moins 2 caract\u00e8res\u2026', en:'Type at least 2 characters\u2026', sw:'Andika angalau herufi 2\u2026', es:'Escriba al menos 2 caracteres\u2026', zh:'输入至少 2 个字符进行搜索。', ln:'Koma búku mibale mpo na koluka.'},
  sr_total:           { fr:'r\u00e9sultat(s)', en:'result(s)', sw:'matokeo', es:'resultado(s)', zh:'共', ln:'Nyonso'},
  sr_page:            { fr:'Page', en:'Page', sw:'Ukurasa', es:'P\u00e1gina', zh:'页', ln:'Lokasa'},
  sr_prev:            { fr:'Pr\u00e9c\u00e9dent', en:'Previous', sw:'Iliyopita', es:'Anterior', zh:'上一页', ln:'Liboso'},
  sr_next:            { fr:'Suivant', en:'Next', sw:'Inayofuata', es:'Siguiente', zh:'下一页', ln:'Nsima'},
  sr_loading:         { fr:'Recherche en cours\u2026', en:'Searching\u2026', sw:'Inatafuta\u2026', es:'Buscando\u2026', zh:'加载中…', ln:'Ezali kolongwa…'},
  sr_date_from:       { fr:'Du', en:'From', sw:'Kuanzia', es:'Desde', zh:'从日期', ln:'Bandá mikolo'},
  sr_date_to:         { fr:'au', en:'to', sw:'hadi', es:'hasta', zh:'到日期', ln:'Tii mikolo'},
  sr_author:          { fr:'Auteur', en:'Author', sw:'Mwandishi', es:'Autor', zh:'作者', ln:'Mokomi'},
  sr_sort:            { fr:'Trier par', en:'Sort by', sw:'Panga kwa', es:'Ordenar por', zh:'排序', ln:'Kokóta'},
  sr_sort_relevance:  { fr:'Pertinence', en:'Relevance', sw:'Umuhimu', es:'Relevancia', zh:'相关度', ln:'Boyokani'},
  sr_sort_recent:     { fr:'Plus r\u00e9cents', en:'Newest', sw:'Mpya zaidi', es:'M\u00e1s recientes', zh:'最新', ln:'Ya sika'},
  sr_sort_popular:    { fr:'Plus populaires', en:'Most popular', sw:'Zinazopendwa', es:'M\u00e1s populares', zh:'最热门', ln:'Ezalaki mingi'},
  sr_filter_category: { fr:'Cat\u00e9gorie', en:'Category', sw:'Kategoria', es:'Categor\u00eda', zh:'按类别筛选', ln:'Filtre na biténi'},
  sr_all_cats:        { fr:'Toutes', en:'All', sw:'Zote', es:'Todas', zh:'所有类别', ln:'Biténi nyonso'},
  sr_clear:           { fr:'Effacer les filtres', en:'Clear filters', sw:'Futa vichujio', es:'Limpiar filtros', zh:'清除', ln:'Kolongola'},
  sr_popular_side:    { fr:'Les plus lus', en:'Most read', sw:'Zinazosomwa zaidi', es:'M\u00e1s le\u00eddos', zh:'最热门', ln:'Ezalaki mingi'},
  sr_other_cats:      { fr:'Autres cat\u00e9gories', en:'Other categories', sw:'Kategoria nyingine', es:'Otras categor\u00edas', zh:'其他类别', ln:'Biténi mosusu'},
  sr_principal:       { fr:'\u00c0 la une de la cat\u00e9gorie', en:'Top story', sw:'Habari kuu', es:'Destacado', zh:'主要文章', ln:'Mokanda mokonzi'},
  sr_cat_articles:    { fr:'articles', en:'articles', sw:'makala', es:'art\u00edculos', zh:'文章', ln:'Makomi'},
  sr_empty:           { fr:'Aucun article pour le moment.', en:'No articles for now.', sw:'Hakuna makala kwa sasa.', es:'Sin art\u00edculos por ahora.', zh:'没有结果。', ln:'Eloko moko te.'},
  sr_notfound:        { fr:'Cat\u00e9gorie introuvable.', en:'Category not found.', sw:'Kategoria haipatikani.', es:'Categor\u00eda no encontrada.', zh:'没有找到匹配的文章。', ln:'Mokanda moko te oyo ekokani.'},
  sr_noq:             { fr:'Entrez un mot-cl\u00e9 pour lancer la recherche.', en:'Type a keyword to search.', sw:'Andika neno kuu kutafuta.', es:'Escriba una palabra clave para buscar.', zh:'请输入搜索词。', ln:'Koma likambo ya koluka.'},
  sr_title:           { fr:'Recherche', en:'Search', sw:'Utafutaji', es:'B\u00fasqueda', zh:'搜索', ln:'Boluka'},
  sr_subtitle:        { fr:'Recherchez par titre, contenu, cat\u00e9gorie, auteur, date ou mots-cl\u00e9s.', en:'Search by title, content, category, author, date or keywords.', sw:'Tafuta kwa kichwa, maudhui, kategoria, mwandishi, tarehe au maneno.', es:'Busque por t\u00edtulo, contenido, categor\u00eda, autor, fecha o palabras clave.', zh:'在整个网站中搜索。', ln:'Boluka na esika nyonso ya site.'},

  // === NOTIFICATIONS ===
  ntf_title:          { fr:'Recevez les derni\u00e8res actualit\u00e9s', en:'Receive the latest news', sw:'Pokea habari za hivi punde', es:'Reciba las \u00faltimas noticias', zh:'接收最新新闻', ln:'Zwa makambo ya sika'},
  ntf_desc:           { fr:'Activez les notifications pour \u00eatre alert\u00e9 d\u00e8s la publication d\u2019un article ou d\u2019une Breaking News.', en:'Turn on notifications to be alerted as soon as an article or a Breaking News is published.', sw:'Washa arifa ili ujulishwe mara tu makala au Breaking News inapochapishwa.', es:'Active las notificaciones para ser alertado en cuanto se publique un art\u00edculo o una Breaking News.', zh:'开启通知，文章或突发新闻发布时第一时间获知。', ln:'Tinda bokebisi mpo na koyeba ntango mokanda to sango ya suki ebimi.'},
  ntf_label_news:     { fr:'Derni\u00e8res actualit\u00e9s', en:'Latest news', sw:'Habari za hivi punde', es:'\u00daltimas noticias', zh:'最新新闻', ln:'Makambo ya sika'},
  ntf_label_breaking: { fr:'Breaking News', en:'Breaking News', sw:'Breaking News', es:'Breaking News', zh:'突发新闻', ln:'Sango ya suki'},
  ntf_label_rdc:      { fr:'Actualit\u00e9s de la RDC', en:'DRC news', sw:'Habari za DRC', es:'Noticias de la RDC', zh:'刚果民主共和国新闻', ln:'Makambo ya RDC'},
  ntf_label_intl:     { fr:'Actualit\u00e9s internationales', en:'International news', sw:'Habari za kimataifa', es:'Noticias internacionales', zh:'国际新闻', ln:'Makambo ya mokili mobimba'},
  ntf_btn_on:         { fr:'Activer les notifications', en:'Enable notifications', sw:'Washa arifa', es:'Activar notificaciones', zh:'开启通知', ln:'Tinda bokebisi'},
  ntf_btn_off:        { fr:'D\u00e9sactiver', en:'Disable', sw:'Zima', es:'Desactivar', zh:'关闭通知', ln:'Kokanga bokebisi'},
  ntf_ok_push:        { fr:'Notifications activ\u00e9es. Merci !', en:'Notifications enabled. Thank you!', sw:'Arifa zimewashwa. Asante!', es:'\u00a1Notificaciones activadas. Gracias!', zh:'通知已开启。', ln:'Bokebisi ekomi liboke ya sika.'},
  ntf_ok_prefs:       { fr:'Pr\u00e9f\u00e9rences enregistr\u00e9es. Les notifications push ne sont pas disponibles sur ce navigateur.', en:'Preferences saved. Push notifications are not available on this browser.', sw:'Mapendeleo yamehifadhiwa. Arifa za push hazipatikani kwenye kivinjari hiki.', es:'Preferencias guardadas. Las notificaciones push no est\u00e1n disponibles en este navegador.', zh:'偏好已保存。', ln:'Boponi na yó ebombami.'},
  ntf_err:            { fr:'Une erreur est survenue. R\u00e9essayez plus tard.', en:'An error occurred. Try again later.', sw:'Hitilafu imetokea. Jaribu tena baadaye.', es:'Se produjo un error. Int\u00e9ntelo de nuevo m\u00e1s tarde.', zh:'无法开启通知。请重试。', ln:'Tokokaki te kotinda bokebisi. Jála lisusu.'},
  ntf_already:        { fr:'Notifications d\u00e9j\u00e0 activ\u00e9es.', en:'Notifications already enabled.', sw:'Arifa tayari zimewashwa.', es:'Notificaciones ya activadas.', zh:'您已经订阅了通知。', ln:'Okomí sika na bokebisi.'},

  // === PLUS LUS ===
  popular_title:      { fr:'Les plus lus', en:'Most read', sw:'Zinazosomwa zaidi', es:'M\u00e1s le\u00eddos', zh:'热门', ln:'Ezalaki mingi'},
  popular_today:      { fr:'Aujourd\u2019hui', en:'Today', sw:'Leo', es:'Hoy', zh:'今天', ln:'Lelo'},
  popular_week:       { fr:'Cette semaine', en:'This week', sw:'Wiki hii', es:'Esta semana', zh:'本周', ln:'Posa oyo'},
  popular_month:      { fr:'Ce mois', en:'This month', sw:'Mwezi huu', es:'Este mes', zh:'本月', ln:'Sanze oyo'},
  popular_all:        { fr:'Depuis la publication', en:'All time', sw:'Tangu kuchapishwa', es:'Desde la publicaci\u00f3n', zh:'全部', ln:'Nyonso'},

  // === CONTACT (APPEL / WHATSAPP) ===
  contact_title:      { fr:'Contacter la r\u00e9daction', en:'Contact the newsroom', sw:'Wasiliana na wahariri', es:'Contactar a la redacci\u00f3n', zh:'联系编辑部', ln:'Kosakana na bakomi'},
  contact_desc:       { fr:'Choisissez votre moyen de contact', en:'Choose how to contact us', sw:'Chagua jinsi ya kuwasiliana', es:'Elige c\u00f3mo contactarnos', zh:'选择联系方式', ln:'Pona lolenge ya kosakana'},
  contact_call:       { fr:'Passer un appel', en:'Make a call', sw:'Piga simu', es:'Hacer una llamada', zh:'拨打电话', ln:'Kobenga na telef\u00f3ne'},
  contact_whatsapp:   { fr:'Message WhatsApp', en:'WhatsApp message', sw:'Ujumbe wa WhatsApp', es:'Mensaje de WhatsApp', zh:'WhatsApp 消息', ln:'Sika na WhatsApp'},
  contact_close:      { fr:'Fermer', en:'Close', sw:'Funga', es:'Cerrar', zh:'关闭', ln:'Kokanga'},

  // === GENERIC ===
  learn_more:         { fr:'En savoir plus', en:'Learn more', sw:'Jifunze zaidi', es:'Saber m\u00e1s', zh:'了解更多', ln:'Yéba mingi'},
  read_article:       { fr:'Lire l\'article', en:'Read article', sw:'Soma makala', es:'Leer art\u00edculo', zh:'阅读文章', ln:'Tangá mokanda'},
  back_to_site:       { fr:'\u2b05 Retour au site', en:'\u2b05 Back to site', sw:'\u2b05 Rudi kwenye tovuti', es:'\u2b05 Volver al sitio', zh:'返回网站', ln:'Bozonga na site'},
  logout:             { fr:'D\u00e9connexion', en:'Logout', sw:'Toka', es:'Cerrar sesi\u00f3n', zh:'退出登录', ln:'Kobima'},
};

// ===== LANGUAGE MANAGEMENT =====
var currentLang = localStorage.getItem('cms_lang') || 'fr';

function t(key) {
  var tr = TRANSLATIONS[key];
  if (!tr) return key;
  return tr[currentLang] || tr['fr'] || key;
}

function setLang(lang) {
  if (LANG_KEYS.indexOf(lang) === -1) return;
  currentLang = lang;
  localStorage.setItem('cms_lang', lang);
  document.documentElement.lang = lang;
  applyTranslations();
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var key = el.dataset.i18n;
    var val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else {
      el.innerHTML = val;
    }
  });
  // Update active language in selector
  document.querySelectorAll('.lang-btn').forEach(function(b){
    b.classList.toggle('active', b.dataset.lang === currentLang);
  });
  // Dispatch event for other scripts
  document.dispatchEvent(new CustomEvent('langchange', {detail:{lang:currentLang}}));
}

(function(){
  // Add language selector to top-bar
  var langHtml = '<div class="lang-selector" style="display:flex;gap:2px;margin:0 8px;">';
  LANG_KEYS.forEach(function(l){
    langHtml += '<button class="lang-btn'+(l===currentLang?' active':'')+'" data-lang="'+l+'" style="background:'+(l===currentLang?'var(--secondary)':'rgba(255,255,255,0.15)')+';color:#fff;border:none;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:0.75rem;font-weight:600;">'+l.toUpperCase()+'</button>';
  });
  langHtml += '</div>';
  langHtml += '<a class="top-login-btn" href="admin/login.html" data-i18n="admin_login" title="Administrateur">\ud83d\udd12 ' + t('admin_login') + '</a>';

  document.addEventListener('DOMContentLoaded', function(){
    var socialLinks = document.querySelector('.top-bar .container .social-links');
    if (socialLinks) {
      var wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:flex;align-items:center;gap:4px;margin:0 auto;';
      wrapper.innerHTML = socialLinks.outerHTML + langHtml;
      socialLinks.parentNode.replaceChild(wrapper, socialLinks);
    }

    document.querySelector('.lang-selector')?.addEventListener('click', function(e){
      var btn = e.target.closest('.lang-btn');
      if (btn) {
        setLang(btn.dataset.lang);
        // Reload dynamic content
        document.dispatchEvent(new Event('langchange'));
      }
    });

    applyTranslations();
  });
})();
