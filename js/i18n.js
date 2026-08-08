// ===== i18n SYSTEM =====
var LANGUAGES = { fr:'Fran\u00e7ais', en:'English', sw:'Kiswahili', es:'Espa\u00f1ol' };
var LANG_KEYS = ['fr','en','sw','es'];

var TRANSLATIONS = {
  // === NAVIGATION ===
  nav_accueil:        { fr:'Accueil', en:'Home', sw:'Nyumbani', es:'Inicio' },
  nav_actualites:     { fr:'Actualit\u00e9s', en:'News', sw:'Habari', es:'Noticias' },
  nav_qui_sommes_nous:{ fr:'Qui sommes-nous', en:'About Us', sw:'Sisi ni nani', es:'Qui\u00e9nes somos' },
  nav_projets:        { fr:'Projets', en:'Projects', sw:'Miradi', es:'Proyectos' },
  nav_sensibilisation:{ fr:'Sensibilisation', en:'Awareness', sw:'Uhamasishaji', es:'Concienciaci\u00f3n' },
  nav_objets_perdus:  { fr:'Objets perdus', en:'Lost & Found', sw:'Vitu vilivyopotea', es:'Objetos perdidos' },
  nav_heritage:       { fr:'H\u00e9ritage', en:'Heritage', sw:'Urithi', es:'Patrimonio' },
  nav_faq:            { fr:'FAQ', en:'FAQ', sw:'Maswali', es:'Preguntas' },
  nav_donation:       { fr:'Donation', en:'Donate', sw:'Mchango', es:'Donar' },

  // === LOGO / TAGLINE ===
  logo_title:         { fr:'Chronique de James Mukeshaba', en:'James Mukeshaba Chronicle', sw:'Chronicle ya James Mukeshaba', es:'Cr\u00f3nica de James Mukeshaba' },
  logo_tagline:       { fr:'Informations \u2022 Sensibilisation \u2022 Projets', en:'News \u2022 Awareness \u2022 Projects', sw:'Habari \u2022 Uhamasishaji \u2022 Miradi', es:'Noticias \u2022 Concienciaci\u00f3n \u2022 Proyectos' },

  // === HERO SLIDER ===
  hero_read_article:  { fr:'Lire l\'article', en:'Read article', sw:'Soma makala', es:'Leer art\u00edculo' },

  // === MISSION ===
  mission_title:      { fr:'Notre Mission', en:'Our Mission', sw:'Dhamira yetu', es:'Nuestra Misi\u00f3n' },
  mission_text:       { fr:'Informer, sensibiliser et mobiliser les communaut\u00e9s congolaises en RDC et dans la diaspora. La Chronique de James Mukeshaba est votre source d\'information fiable pour un monde meilleur.', en:'Inform, raise awareness and mobilize Congolese communities in the DRC and diaspora. James Mukeshaba Chronicle is your reliable news source for a better world.', sw:'Kuwaarifu, kuhamasisha na kuhamasisha jamii za Kongo katika DRC na diaspora. Chronicle ya James Mukeshaba ni chanzo chako cha habari cha kuaminika kwa ulimwengu bora.', es:'Informar, sensibilizar y movilizar a las comunidades congole\u00f1as en la RDC y la di\u00e1spora. La Cr\u00f3nica de James Mukeshaba es su fuente de informaci\u00f3n confiable para un mundo mejor.' },
  mission_sign:       { fr:'\u2014 <strong>James Mukeshaba</strong>, Coordonnateur principal', en:'\u2014 <strong>James Mukeshaba</strong>, Chief Coordinator', sw:'\u2014 <strong>James Mukeshaba</strong>, Mratibu Mkuu', es:'\u2014 <strong>James Mukeshaba</strong>, Coordinador Principal' },

  // === CAMPAIGN CAROUSEL ===
  campaign_title:     { fr:'Campagnes en cours', en:'Active Campaigns', sw:'Kampeni zinazoendelea', es:'Campa\u00f1as activas' },
  campaign_empty:     { fr:'Aucune campagne en cours.', en:'No active campaigns.', sw:'Hakuna kampeni zinazoendelea.', es:'No hay campa\u00f1as activas.' },

  // === ARTICLES ===
  latest_news:        { fr:'Derni\u00e8res Actualit\u00e9s', en:'Latest News', sw:'Habari za hivi punde', es:'\u00daltimas Noticias' },
  view_all_news:      { fr:'Voir toutes les actualit\u00e9s', en:'View all news', sw:'Tazama habari zote', es:'Ver todas las noticias' },
  all_news:           { fr:'Actualit\u00e9s', en:'All News', sw:'Habari zote', es:'Todas las noticias' },

  // === NEWSLETTER ===
  newsletter_title:   { fr:'Restez inform\u00e9', en:'Stay informed', sw:'Kaa na habari', es:'Mant\u00e9ngase informado' },
  newsletter_desc:    { fr:'Abonnez-vous \u00e0 notre newsletter et recevez les derni\u00e8res actualit\u00e9s directement dans votre bo\u00eete mail.', en:'Subscribe to our newsletter and receive the latest news directly in your inbox.', sw:'Jisajili kwa jarida letu na upokee habari za hivi punde moja kwa moja kwenye kikasha chako.', es:'Suscr\u00edbase a nuestro bolet\u00edn y reciba las \u00faltimas noticias directamente en su bandeja de entrada.' },
  newsletter_placeholder:{ fr:'Votre adresse email', en:'Your email address', sw:'Barua pepe yako', es:'Su correo electr\u00f3nico' },
  newsletter_button:  { fr:'S\'abonner', en:'Subscribe', sw:'Jisajili', es:'Suscribirse' },

  // === PAGE HEADERS ===
  page_title_actualites:   { fr:'Actualit\u00e9s', en:'News', sw:'Habari', es:'Noticias' },
  page_subtitle_actualites:{ fr:'Retrouvez toute l\'actualit\u00e9 de la Chronique de James Mukeshaba', en:'All the latest from James Mukeshaba Chronicle', sw:'Habari zote kutoka Chronicle ya James Mukeshaba', es:'Todas las \u00faltimas noticias de la Cr\u00f3nica de James Mukeshaba' },

  // === ARTICLE DETAIL ===
  share_title:        { fr:'Partager cet article :', en:'Share this article:', sw:'Shiriki makala hii:', es:'Compartir este art\u00edculo:' },
  share_facebook:     { fr:'\ud83d\udcd8 Partager sur Facebook', en:'\ud83d\udcd8 Share on Facebook', sw:'\ud83d\udcd8 Shiriki kwenye Facebook', es:'\ud83d\udcd8 Compartir en Facebook' },
  share_x:            { fr:'\ud835\udd4f Partager sur X', en:'\ud835\udd4f Share on X', sw:'\ud835\udd4f Shiriki kwenye X', es:'\ud835\udd4f Compartir en X' },
  comments_title:     { fr:'Commentaires', en:'Comments', sw:'Maoni', es:'Comentarios' },
  comment_form_title: { fr:'Laisser un commentaire', en:'Leave a comment', sw:'Acha maoni', es:'Dejar un comentario' },
  comment_name_placeholder:{ fr:'Votre nom', en:'Your name', sw:'Jina lako', es:'Su nombre' },
  comment_text_placeholder:{ fr:'Votre commentaire...', en:'Your comment...', sw:'Maoni yako...', es:'Su comentario...' },
  comment_submit:     { fr:'Publier le commentaire', en:'Publish comment', sw:'Chapisha maoni', es:'Publicar comentario' },
  content_unavailable:{ fr:'Contenu non disponible.', en:'Content not available.', sw:'Maudhui hayapatikani.', es:'Contenido no disponible.' },
  article_by:         { fr:'Par', en:'By', sw:'Na', es:'Por' },
  no_comments:        { fr:'Aucun commentaire pour le moment. Soyez le premier \u00e0 commenter !', en:'No comments yet. Be the first to comment!', sw:'Hakuna maoni kwa sasa. Kuwa wa kwanza kutoa maoni!', es:'No hay comentarios todav\u00eda. \u00a1S\u00e9 el primero en comentar!' },

  // === FOOTER ===
  footer_pages:       { fr:'Pages', en:'Pages', sw:'Kurasa', es:'P\u00e1ginas' },
  footer_contact:     { fr:'Contact', en:'Contact', sw:'Mawasiliano', es:'Contacto' },
  footer_admin:       { fr:'Administration', en:'Administration', sw:'Usimamizi', es:'Administraci\u00f3n' },
  footer_address:     { fr:'Bukavu, Sud-Kivu, RDC', en:'Bukavu, South Kivu, DRC', sw:'Bukavu, Kivu Kusini, DRC', es:'Bukavu, Kivu del Sur, RDC' },
  footer_phone_rdc:   { fr:'+243 971460415', en:'+243 971460415', sw:'+243 971460415', es:'+243 971460415' },
  footer_phone_canada:{ fr:'+1 (825) 449-0187 (Canada)', en:'+1 (825) 449-0187 (Canada)', sw:'+1 (825) 449-0187 (Kanada)', es:'+1 (825) 449-0187 (Canad\u00e1)' },
  footer_admin_link:  { fr:'Espace administrateur', en:'Admin area', sw:'Eneo la usimamizi', es:'\u00c1rea de administraci\u00f3n' },
  footer_description: { fr:'M\u00e9dia d\'information en ligne, sensibilisation et projets communautaires.', en:'Online news media, awareness and community projects.', sw:'Vyombo vya habari mtandaoni, uhamasishaji na miradi ya jamii.', es:'Medio de noticias en l\u00ednea, concientizaci\u00f3n y proyectos comunitarios.' },
  pwa_install:        { fr:'\ud83d\udcf2 Installer l\'application', en:'\ud83d\udcf2 Install the app', sw:'\ud83d\udcf2 Sakinisha programu', es:'\ud83d\udcf2 Instalar la aplicaci\u00f3n' },
  copyright:          { fr:'\u00a9 2026 Chronique de James Mukeshaba. Tous droits r\u00e9serv\u00e9s.', en:'\u00a9 2026 James Mukeshaba Chronicle. All rights reserved.', sw:'\u00a9 2026 Chronicle ya James Mukeshaba. Haki zote zimehifadhiwa.', es:'\u00a9 2026 Cr\u00f3nica de James Mukeshaba. Todos los derechos reservados.' },

  // === BREADCRUMB ===
  breadcrumb_home:    { fr:'Accueil', en:'Home', sw:'Nyumbani', es:'Inicio' },
  breadcrumb_actualites:{ fr:'Actualit\u00e9s', en:'News', sw:'Habari', es:'Noticias' },
  breadcrumb_article: { fr:'Article', en:'Article', sw:'Makala', es:'Art\u00edculo' },

  // === DONATION ===
  donation_title:     { fr:'Soutenez notre M\u00e9dia', en:'Support Our Media', sw:'Tegemea Vyombo vyetu vya Habari', es:'Apoye Nuestro Medio' },
  donation_subtitle:  { fr:'Votre don finance nos projets et notre ind\u00e9pendance', en:'Your donation funds our projects and independence', sw:'Mchango wako unafadhili miradi yetu na uhuru wetu', es:'Su donaci\u00f3n financia nuestros proyectos e independencia' },
  donation_make:      { fr:'Faire un Don', en:'Make a Donation', sw:'Toa Mchango', es:'Hacer una Donaci\u00f3n' },
  donation_desc:      { fr:'Chaque contribution, grande ou petite, nous aide \u00e0 continuer notre mission d\'information et de sensibilisation.', en:'Every contribution, big or small, helps us continue our mission of information and awareness.', sw:'Kila mchango, mkubwa au mdogo, unatusaidia kuendeleza dhamira yetu ya habari na uhamasishaji.', es:'Cada contribuci\u00f3n, grande o peque\u00f1a, nos ayuda a continuar nuestra misi\u00f3n de informaci\u00f3n y concienciaci\u00f3n.' },
  donation_custom:    { fr:'Libre', en:'Custom', sw:'Bure', es:'Libre' },
  donation_amount_ph: { fr:'Montant personnalis\u00e9', en:'Custom amount', sw:'Kiasi maalum', es:'Cantidad personalizada' },
  donation_name_label:{ fr:'Nom complet', en:'Full name', sw:'Jina kamili', es:'Nombre completo' },
  donation_name_ph:   { fr:'Votre nom', en:'Your name', sw:'Jina lako', es:'Su nombre' },
  donation_email_label:{ fr:'Email', en:'Email', sw:'Barua pepe', es:'Correo electr\u00f3nico' },
  donation_email_ph:  { fr:'Votre email', en:'Your email', sw:'Barua pepe yako', es:'Su correo' },
  donation_submit:    { fr:'Faire un don s\u00e9curis\u00e9', en:'Make a secure donation', sw:'Toa mchango salama', es:'Hacer una donaci\u00f3n segura' },
  donation_secure:    { fr:'\ud83d\udd12 Paiement s\u00e9curis\u00e9. Votre don sera trait\u00e9 en toute s\u00e9curit\u00e9.', en:'\ud83d\udd12 Secure payment. Your donation will be processed safely.', sw:'\ud83d\udd12 Malipo salama. Mchango wako utashughulikiwa kwa usalama.', es:'\ud83d\udd12 Pago seguro. Su donaci\u00f3n ser\u00e1 procesada de forma segura.' },

  // === LOST & FOUND ===
  lf_title:           { fr:'Objets Perdus et Trouv\u00e9s', en:'Lost & Found', sw:'Vitu Vilivyopotea na Kupatikana', es:'Objetos Perdidos y Encontrados' },
  lf_subtitle:        { fr:'Espace communautaire d\'entraide', en:'Community help space', sw:'Nafasi ya usaidizi wa jamii', es:'Espacio comunitario de ayuda' },
  lf_intro:           { fr:'D\u00e9clarez un objet perdu ou trouv\u00e9 pour aider la communaut\u00e9.', en:'Report a lost or found item to help the community.', sw:'Ripoti kitu kilichopotea au kupatikana kusaidia jamii.', es:'Reporte un objeto perdido o encontrado para ayudar a la comunidad.' },
  lf_publish:         { fr:'+ Publier une annonce', en:'+ Publish an ad', sw:'+ Chapisha tangazo', es:'+ Publicar un anuncio' },
  lf_form_title:      { fr:'Nouvelle annonce', en:'New ad', sw:'Tangazo jipya', es:'Nuevo anuncio' },
  lf_type_label:      { fr:'Type d\'annonce', en:'Ad type', sw:'Aina ya tangazo', es:'Tipo de anuncio' },
  lf_type_lost:       { fr:'Objet perdu', en:'Lost item', sw:'Kitu kilichopotea', es:'Objeto perdido' },
  lf_type_found:      { fr:'Objet trouv\u00e9', en:'Found item', sw:'Kitu kilichopatikana', es:'Objeto encontrado' },
  lf_item_label:      { fr:'Objet', en:'Item', sw:'Kitu', es:'Objeto' },
  lf_item_ph:         { fr:'Nom de l\'objet', en:'Item name', sw:'Jina la kitu', es:'Nombre del objeto' },
  lf_desc_label:      { fr:'Description', en:'Description', sw:'Maelezo', es:'Descripci\u00f3n' },
  lf_desc_ph:         { fr:'Description d\u00e9taill\u00e9e, lieu, date...', en:'Detailed description, location, date...', sw:'Maelezo ya kina, mahali, tarehe...', es:'Descripci\u00f3n detallada, lugar, fecha...' },
  lf_contact_label:   { fr:'Contact', en:'Contact', sw:'Mawasiliano', es:'Contacto' },
  lf_contact_ph:      { fr:'T\u00e9l\u00e9phone ou email', en:'Phone or email', sw:'Simu au barua pepe', es:'Tel\u00e9fono o correo' },
  lf_submit_btn:      { fr:'Publier l\'annonce', en:'Publish ad', sw:'Chapisha tangazo', es:'Publicar anuncio' },
  lf_cancel_btn:      { fr:'Annuler', en:'Cancel', sw:'Ghairi', es:'Cancelar' },
  lf_status_lost:     { fr:'\ud83d\udd34 Perdu', en:'\ud83d\udd34 Lost', sw:'\ud83d\udd34 Imepotea', es:'\ud83d\udd34 Perdido' },
  lf_status_found:    { fr:'\ud83d\udfe2 Trouv\u00e9', en:'\ud83d\udfe2 Found', sw:'\ud83d\udfe2 Imepatikana', es:'\ud83d\udfe2 Encontrado' },

  // === FAQ ===
  faq_title:          { fr:'Questions Fr\u00e9quentes', en:'Frequently Asked Questions', sw:'Maswali Yanayoulizwa Mara kwa Mara', es:'Preguntas Frecuentes' },
  faq_subtitle:       { fr:'Tout ce que vous devez savoir sur la Chronique de James Mukeshaba', en:'Everything you need to know about James Mukeshaba Chronicle', sw:'Kila kitu unachohitaji kujua kuhusu Chronicle ya James Mukeshaba', es:'Todo lo que necesita saber sobre la Cr\u00f3nica de James Mukeshaba' },

  // === HERITAGE ===
  heritage_title:     { fr:'H\u00e9ritage', en:'Heritage', sw:'Urithi', es:'Patrimonio' },
  heritage_subtitle:  { fr:'Archives, culture et m\u00e9moires du Congo', en:'Archives, culture and memories of Congo', sw:'Kumbukumbu, utamaduni na kumbukumbu za Kongo', es:'Archivos, cultura y memorias del Congo' },

  // === PROJECTS ===
  projects_title:     { fr:'Nos Projets', en:'Our Projects', sw:'Miradi Yetu', es:'Nuestros Proyectos' },
  projects_subtitle:  { fr:'Des initiatives qui transforment nos communaut\u00e9s', en:'Initiatives transforming our communities', sw:'Mipango inayobadilisha jamii zetu', es:'Iniciativas que transforman nuestras comunidades' },

  // === ABOUT ===
  about_title:        { fr:'Qui sommes-nous', en:'About Us', sw:'Sisi ni nani', es:'Qui\u00e9nes somos' },
  about_subtitle:     { fr:'Une institution m\u00e9diatique ind\u00e9pendante et engag\u00e9e', en:'An independent and committed media institution', sw:'Taasisi ya vyombo vya habari huru na inayojitolea', es:'Una instituci\u00f3n medi\u00e1tica independiente y comprometida' },

  // === SENSIBILISATION ===
  sensibilisation_title:    { fr:'Sensibilisation', en:'Awareness', sw:'Uhamasishaji', es:'Concienciaci\u00f3n' },
  sensibilisation_subtitle: { fr:'Des campagnes pour un impact social durable', en:'Campaigns for lasting social impact', sw:'Kampeni za athari za kijamii za kudumu', es:'Campa\u00f1as para un impacto social duradero' },
  sensibilisation_archived: { fr:'Campagnes archiv\u00e9es', en:'Archived Campaigns', sw:'Kampeni zilizohifadhiwa', es:'Campa\u00f1as archivadas' },
  sensibilisation_no_archived: { fr:'Aucune campagne archiv\u00e9e pour le moment.', en:'No archived campaigns for now.', sw:'Hakuna kampeni zilizohifadhiwa kwa sasa.', es:'No hay campa\u00f1as archivadas por ahora.' },

  // === HOME MODERNE ===
  home_breaking:      { fr:'Derni\u00e8re heure', en:'Breaking News', sw:'Habari za mwisho', es:'\u00daltima hora' },
  home_alaune:        { fr:'\u00c0 la Une', en:'Top Stories', sw:'Habari kuu', es:'Portada' },
  home_latest:        { fr:'Derni\u00e8res actualit\u00e9s', en:'Latest News', sw:'Habari za hivi punde', es:'\u00daltimas noticias' },
  home_view_more:     { fr:'Voir plus', en:'View more', sw:'Tazama zaidi', es:'Ver m\u00e1s' },
  home_support:       { fr:'Soutenir nos actions', en:'Support our actions', sw:'Tunga mkono shughuli zetu', es:'Apoyar nuestras acciones' },
  home_search_ph:     { fr:'Rechercher un article\u2026', en:'Search an article\u2026', sw:'Tafuta makala\u2026', es:'Buscar un art\u00edculo\u2026' },
  home_search_hint:   { fr:'Tapez pour rechercher un article\u2026', en:'Type to search an article\u2026', sw:'Andika kutafuta makala\u2026', es:'Escriba para buscar un art\u00edculo\u2026' },
  home_search_none:   { fr:'Aucun r\u00e9sultat pour cette recherche.', en:'No results for this search.', sw:'Hakuna matokeo ya utafutaji huu.', es:'Sin resultados para esta b\u00fasqueda.' },
  home_search_title:  { fr:'R\u00e9sultats', en:'Results', sw:'Matokeo', es:'Resultados' },

  // === ARTICLE MODERNE ===
  reading_time:       { fr:'Lecture', en:'Reading', sw:'Usomaji', es:'Lectura' },
  modified:           { fr:'Mis \u00e0 jour', en:'Updated', sw:'Imesasishwa', es:'Actualizado' },
  priority_important: { fr:'Important', en:'Important', sw:'Muhimu', es:'Importante' },
  sources:            { fr:'Sources', en:'Sources', sw:'Vyanzo', es:'Fuentes' },
  report_comment:     { fr:'Signaler', en:'Report', sw:'Ripoti', es:'Reportar' },
  copied_link:        { fr:'Lien copi\u00e9 dans le presse-papiers.', en:'Link copied to clipboard.', sw:'Kiungo kimenakiliwa.', es:'Enlace copiado.' },

  // === RECHERCHE & CATEGORIES ===
  sr_placeholder:     { fr:'Rechercher un article, une cat\u00e9gorie, un auteur\u2026', en:'Search an article, a category, an author\u2026', sw:'Tafuta makala, kategoria, mwandishi\u2026', es:'Buscar un art\u00edculo, una categor\u00eda, un autor\u2026' },
  sr_categories:      { fr:'Cat\u00e9gories', en:'Categories', sw:'Kategoria', es:'Categor\u00edas' },
  sr_recent:          { fr:'Derniers articles', en:'Latest articles', sw:'Makala za hivi punde', es:'\u00daltimos art\u00edculos' },
  sr_popular:         { fr:'Les plus lus', en:'Most read', sw:'Zinazosomwa zaidi', es:'M\u00e1s le\u00eddos' },
  sr_results:         { fr:'R\u00e9sultats', en:'Results', sw:'Matokeo', es:'Resultados' },
  sr_all:             { fr:'Voir tous les r\u00e9sultats', en:'See all results', sw:'Ona matokeo yote', es:'Ver todos los resultados' },
  sr_none:            { fr:'Aucun r\u00e9sultat pour cette recherche.', en:'No results for this search.', sw:'Hakuna matokeo ya utafutaji huu.', es:'Sin resultados para esta b\u00fasqueda.' },
  sr_hint:            { fr:'Tapez au moins 2 caract\u00e8res\u2026', en:'Type at least 2 characters\u2026', sw:'Andika angalau herufi 2\u2026', es:'Escriba al menos 2 caracteres\u2026' },
  sr_total:           { fr:'r\u00e9sultat(s)', en:'result(s)', sw:'matokeo', es:'resultado(s)' },
  sr_page:            { fr:'Page', en:'Page', sw:'Ukurasa', es:'P\u00e1gina' },
  sr_prev:            { fr:'Pr\u00e9c\u00e9dent', en:'Previous', sw:'Iliyopita', es:'Anterior' },
  sr_next:            { fr:'Suivant', en:'Next', sw:'Inayofuata', es:'Siguiente' },
  sr_loading:         { fr:'Recherche en cours\u2026', en:'Searching\u2026', sw:'Inatafuta\u2026', es:'Buscando\u2026' },
  sr_date_from:       { fr:'Du', en:'From', sw:'Kuanzia', es:'Desde' },
  sr_date_to:         { fr:'au', en:'to', sw:'hadi', es:'hasta' },
  sr_author:          { fr:'Auteur', en:'Author', sw:'Mwandishi', es:'Autor' },
  sr_sort:            { fr:'Trier par', en:'Sort by', sw:'Panga kwa', es:'Ordenar por' },
  sr_sort_relevance:  { fr:'Pertinence', en:'Relevance', sw:'Umuhimu', es:'Relevancia' },
  sr_sort_recent:     { fr:'Plus r\u00e9cents', en:'Newest', sw:'Mpya zaidi', es:'M\u00e1s recientes' },
  sr_sort_popular:    { fr:'Plus populaires', en:'Most popular', sw:'Zinazopendwa', es:'M\u00e1s populares' },
  sr_filter_category: { fr:'Cat\u00e9gorie', en:'Category', sw:'Kategoria', es:'Categor\u00eda' },
  sr_all_cats:        { fr:'Toutes', en:'All', sw:'Zote', es:'Todas' },
  sr_clear:           { fr:'Effacer les filtres', en:'Clear filters', sw:'Futa vichujio', es:'Limpiar filtros' },
  sr_popular_side:    { fr:'Les plus lus', en:'Most read', sw:'Zinazosomwa zaidi', es:'M\u00e1s le\u00eddos' },
  sr_other_cats:      { fr:'Autres cat\u00e9gories', en:'Other categories', sw:'Kategoria nyingine', es:'Otras categor\u00edas' },
  sr_principal:       { fr:'\u00c0 la une de la cat\u00e9gorie', en:'Top story', sw:'Habari kuu', es:'Destacado' },
  sr_cat_articles:    { fr:'articles', en:'articles', sw:'makala', es:'art\u00edculos' },
  sr_empty:           { fr:'Aucun article pour le moment.', en:'No articles for now.', sw:'Hakuna makala kwa sasa.', es:'Sin art\u00edculos por ahora.' },
  sr_notfound:        { fr:'Cat\u00e9gorie introuvable.', en:'Category not found.', sw:'Kategoria haipatikani.', es:'Categor\u00eda no encontrada.' },
  sr_noq:             { fr:'Entrez un mot-cl\u00e9 pour lancer la recherche.', en:'Type a keyword to search.', sw:'Andika neno kuu kutafuta.', es:'Escriba una palabra clave para buscar.' },
  sr_title:           { fr:'Recherche', en:'Search', sw:'Utafutaji', es:'B\u00fasqueda' },
  sr_subtitle:        { fr:'Recherchez par titre, contenu, cat\u00e9gorie, auteur, date ou mots-cl\u00e9s.', en:'Search by title, content, category, author, date or keywords.', sw:'Tafuta kwa kichwa, maudhui, kategoria, mwandishi, tarehe au maneno.', es:'Busque por t\u00edtulo, contenido, categor\u00eda, autor, fecha o palabras clave.' },

  // === NOTIFICATIONS ===
  ntf_title:          { fr:'Recevez les derni\u00e8res actualit\u00e9s', en:'Receive the latest news', sw:'Pokea habari za hivi punde', es:'Reciba las \u00faltimas noticias' },
  ntf_desc:           { fr:'Activez les notifications pour \u00eatre alert\u00e9 d\u00e8s la publication d\u2019un article ou d\u2019une Breaking News.', en:'Turn on notifications to be alerted as soon as an article or a Breaking News is published.', sw:'Washa arifa ili ujulishwe mara tu makala au Breaking News inapochapishwa.', es:'Active las notificaciones para ser alertado en cuanto se publique un art\u00edculo o una Breaking News.' },
  ntf_label_news:     { fr:'Derni\u00e8res actualit\u00e9s', en:'Latest news', sw:'Habari za hivi punde', es:'\u00daltimas noticias' },
  ntf_label_breaking: { fr:'Breaking News', en:'Breaking News', sw:'Breaking News', es:'Breaking News' },
  ntf_label_rdc:      { fr:'Actualit\u00e9s de la RDC', en:'DRC news', sw:'Habari za DRC', es:'Noticias de la RDC' },
  ntf_label_intl:     { fr:'Actualit\u00e9s internationales', en:'International news', sw:'Habari za kimataifa', es:'Noticias internacionales' },
  ntf_btn_on:         { fr:'Activer les notifications', en:'Enable notifications', sw:'Washa arifa', es:'Activar notificaciones' },
  ntf_btn_off:        { fr:'D\u00e9sactiver', en:'Disable', sw:'Zima', es:'Desactivar' },
  ntf_ok_push:        { fr:'Notifications activ\u00e9es. Merci !', en:'Notifications enabled. Thank you!', sw:'Arifa zimewashwa. Asante!', es:'\u00a1Notificaciones activadas. Gracias!' },
  ntf_ok_prefs:       { fr:'Pr\u00e9f\u00e9rences enregistr\u00e9es. Les notifications push ne sont pas disponibles sur ce navigateur.', en:'Preferences saved. Push notifications are not available on this browser.', sw:'Mapendeleo yamehifadhiwa. Arifa za push hazipatikani kwenye kivinjari hiki.', es:'Preferencias guardadas. Las notificaciones push no est\u00e1n disponibles en este navegador.' },
  ntf_err:            { fr:'Une erreur est survenue. R\u00e9essayez plus tard.', en:'An error occurred. Try again later.', sw:'Hitilafu imetokea. Jaribu tena baadaye.', es:'Se produjo un error. Int\u00e9ntelo de nuevo m\u00e1s tarde.' },
  ntf_already:        { fr:'Notifications d\u00e9j\u00e0 activ\u00e9es.', en:'Notifications already enabled.', sw:'Arifa tayari zimewashwa.', es:'Notificaciones ya activadas.' },

  // === PLUS LUS ===
  popular_title:      { fr:'Les plus lus', en:'Most read', sw:'Zinazosomwa zaidi', es:'M\u00e1s le\u00eddos' },
  popular_today:      { fr:'Aujourd\u2019hui', en:'Today', sw:'Leo', es:'Hoy' },
  popular_week:       { fr:'Cette semaine', en:'This week', sw:'Wiki hii', es:'Esta semana' },
  popular_month:      { fr:'Ce mois', en:'This month', sw:'Mwezi huu', es:'Este mes' },
  popular_all:        { fr:'Depuis la publication', en:'All time', sw:'Tangu kuchapishwa', es:'Desde la publicaci\u00f3n' },

  // === GENERIC ===
  learn_more:         { fr:'En savoir plus', en:'Learn more', sw:'Jifunze zaidi', es:'Saber m\u00e1s' },
  read_article:       { fr:'Lire l\'article', en:'Read article', sw:'Soma makala', es:'Leer art\u00edculo' },
  back_to_site:       { fr:'\u2b05 Retour au site', en:'\u2b05 Back to site', sw:'\u2b05 Rudi kwenye tovuti', es:'\u2b05 Volver al sitio' },
  logout:             { fr:'D\u00e9connexion', en:'Logout', sw:'Toka', es:'Cerrar sesi\u00f3n' },
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
