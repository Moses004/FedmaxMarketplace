export interface CityDetail {
  name: string;
  areas?: string[];
}

export interface StateDetail {
  name: string;
  cities: CityDetail[];
}

export interface CountryData {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
  majorStates: string[];
  popularCities: string[];
  stateHierarchy?: StateDetail[];
}

export const GLOBAL_COUNTRIES: CountryData[] = [
  {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    phoneCode: '+234',
    majorStates: [
      'Lagos State',
      'Federal Capital Territory (Abuja)',
      'Rivers State',
      'Oyo State',
      'Kano State',
      'Enugu State',
      'Anambra State',
      'Delta State',
      'Ogun State',
      'Edo State',
      'Kaduna State',
      'Akwa Ibom State',
      'Cross River State',
      'Kwara State',
      'Ondo State',
      'Osun State',
      'Imo State',
      'Abia State',
      'Benue State',
      'Plateau State',
      'Katsina State',
      'Sokoto State',
      'Bayelsa State',
      'Kogi State',
      'Ekiti State',
      'Nasarawa State',
      'Borno State',
      'Bauchi State',
      'Adamawa State',
      'Zamfara State',
      'Kebbi State',
      'Taraba State',
      'Gombe State',
      'Niger State',
      'Yobe State',
      'Jigawa State',
      'Ebonyi State'
    ],
    popularCities: [
      'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Awka', 'Asaba', 
      'Abeokuta', 'Benin City', 'Kaduna', 'Uyo', 'Calabar', 'Ilorin', 'Akure', 'Osogbo', 
      'Owerri', 'Umuahia', 'Makurdi', 'Jos', 'Abakaliki', 'Yenagoa', 'Lokoja', 'Ado-Ekiti',
      'Lafia', 'Maiduguri', 'Bauchi', 'Yola', 'Gusau', 'Birnin Kebbi', 'Jalingo', 'Gombe', 'Minna', 'Damaturu', 'Dutse'
    ],
    stateHierarchy: [
      {
        name: 'Lagos State',
        cities: [
          { name: 'Lekki', areas: ['Lekki Phase 1', 'Chevron', 'Ikate', 'Agungi', 'Osapa London', 'Sangotedo', 'Abijo', 'Elegushi', 'Ikota'] },
          { name: 'Ikeja', areas: ['Ikeja GRA', 'Allen Avenue', 'Toyin Street', 'Oregun', 'Maryland', 'Agidingbi', 'Computer Village', 'Alausa'] },
          { name: 'Victoria Island', areas: ['Oniru', 'Akin Adesola', 'Ahmadu Bello Way', 'Victoria Island Extension', 'Kofo Abayomi'] },
          { name: 'Ikoyi', areas: ['Old Ikoyi', 'Parkview Estate', 'Banana Island', 'Bourdillon Road', 'Glover Road', 'Osborne Foreshore'] },
          { name: 'Ajah', areas: ['Badore', 'Addo Road', 'Abraham Adesanya', 'Langbasa', 'Oke-Ira', 'Sangotedo Axis'] },
          { name: 'Yaba', areas: ['Akoka', 'Alagomeji', 'Onike', 'Sabo', 'Commercial Avenue', 'Abule Oja', 'Tejuosho'] },
          { name: 'Surulere', areas: ['Bode Thomas', 'Adeniran Ogunsanya', 'Ojuelegba', 'Stadium Area', 'Aguda', 'Ijesha', 'Itire'] },
          { name: 'Magodo', areas: ['Magodo Phase 1 (Isheri)', 'Magodo GRA Phase 2 (Shangisha)', 'CMD Road'] },
          { name: 'Festac Town', areas: ['1st Avenue', '21 Road', '7th Avenue', 'Mile 2', 'Festac Extension', 'Amuwo Odofin'] },
          { name: 'Ikorodu', areas: ['Ikorodu Central', 'Agric', 'Ebute', 'Ikorodu GRA', 'Ipakodo', 'Imota'] },
          { name: 'Epe', areas: ['Epe Town', 'Alaro City', 'Epe Marina', 'Mojoda'] },
          { name: 'Ojodu / Berger', areas: ['Ojodu Berger', 'Omole Phase 1 & 2', 'River Valley Estate', 'Denro', 'Akute Border'] },
          { name: 'Badagry', areas: ['Badagry Town', 'Suntan Beach Axis', 'Ajara', 'Aradagun'] }
        ]
      },
      {
        name: 'Federal Capital Territory (Abuja)',
        cities: [
          { name: 'Maitama', areas: ['Gana Street', 'Maitama Extension', 'Transcorp Axis', 'Aguiyi Ironsi', 'Nile Street'] },
          { name: 'Asokoro', areas: ['Yakubu Gowon Way', 'Guzape Border', 'Diplomatic Zone', 'Protea Axis', 'Tyrwhitt'] },
          { name: 'Wuse', areas: ['Wuse II', 'Aminu Kano Crescent', 'Adetokunbo Ademola', 'Wuse Zone 1 - 7'] },
          { name: 'Garki', areas: ['Garki 1', 'Garki 2', 'Area 1 - 11', 'Garki International Market'] },
          { name: 'Gwarinpa', areas: ['1st Avenue', '3rd Avenue', '5th Avenue', 'Gwarinpa Extension', 'Setraco'] },
          { name: 'Jabi & Utako', areas: ['Jabi Lake', 'Jabi District', 'Utako Market Axis', 'Ebitu Ukiwe'] },
          { name: 'Lugbe & Lokogoma', areas: ['Lugbe Federal Housing', 'Airport Road', 'Lokogoma Estate', 'Sunnyvale Estate', 'Pyakasa'] },
          { name: 'Guzape & Katampe', areas: ['Guzape Phase 1 & 2', 'Katampe Main', 'Katampe Extension'] },
          { name: 'Kubwa & Dawaki', areas: ['Kubwa Phase 4', 'Dawaki Rockview', 'Dutse', 'Bwari Axis'] },
          { name: 'Apo & Durumi', areas: ['Apo Legislative Quarters', 'Apo Resettlement', 'Durumi District'] }
        ]
      },
      {
        name: 'Rivers State',
        cities: [
          { name: 'Port Harcourt', areas: ['GRA Phase 1', 'GRA Phase 2', 'GRA Phase 3', 'D-Line', 'Old PH Township', 'Borokiri', 'Diobu'] },
          { name: 'Obio-Akpor', areas: ['Trans Amadi Industrial Layout', 'Rumuokoro', 'Peter Odili Road', 'Woji', 'Ada George', 'Choba', 'Rumuola', 'Elelenwo'] },
          { name: 'Eleme & Oyigbo', areas: ['Eleme Petrochemical Axis', 'Oyigbo Express Way', 'Onne Port Zone'] },
          { name: 'Ikwerre & Emohua', areas: ['Aluu', 'Isiokpo', 'Emohua Town'] },
          { name: 'Bonny Island', areas: ['Bonny Town', 'NLNG Resident Area'] }
        ]
      },
      {
        name: 'Oyo State',
        cities: [
          { name: 'Ibadan North & Central', areas: ['Bodija Old', 'Bodija New', 'Agodi GRA', 'Samonda', 'Sango', 'UI Area', 'Yemetu'] },
          { name: 'Ibadan South & West', areas: ['Oluyole Estate', 'Ring Road', 'Challenge', 'Dugbe Commercial Hub', 'Iyaganku GRA', 'Jericho GRA', 'Akobo', 'Ologuneru', 'Eleyele'] },
          { name: 'Ogbomoso', areas: ['Oja Igbo', 'Takie', 'Under G', 'General Area'] },
          { name: 'Oyo Town', areas: ['Owode Oyo', 'Isale Oyo', 'Oyo East'] },
          { name: 'Iseyin', areas: ['Iseyin Central', 'Oja Oba'] }
        ]
      },
      {
        name: 'Kano State',
        cities: [
          { name: 'Kano Municipal & Fagge', areas: ['Fagge', 'Sabon Gari', 'Sharada Industrial Estate', 'Kano City Wall', 'Kurmi Market'] },
          { name: 'Nasarawa & Tarauni', areas: ['Nasarawa GRA', 'Brigade', 'Bompai GRA', 'Tarauni', 'Farm Centre'] },
          { name: 'Dala & Gwale', areas: ['Goron Dutse', 'Dorayi', 'Kabuga', 'Bayero University Axis'] },
          { name: 'Wudil', areas: ['Wudil Town', 'KUST Campus Area'] }
        ]
      },
      {
        name: 'Enugu State',
        cities: [
          { name: 'Enugu Urban', areas: ['Independence Layout', 'GRA Enugu', 'New Haven', 'Trans-Ekulu', 'Abakpa Nike', 'Achara Layout', 'Obiagu', 'Ogui', 'Maryland Enugu'] },
          { name: 'Nsukka', areas: ['University Road', 'Odenigbo', 'Ovoko', 'GRA Nsukka'] },
          { name: 'Udi & Oji River', areas: ['Udi Town', 'Oji River Central'] }
        ]
      },
      {
        name: 'Anambra State',
        cities: [
          { name: 'Awka', areas: ['Agu-Awka GRA', 'Amawbia', 'Ifite Awka', 'Temp Site', 'Okpuno'] },
          { name: 'Onitsha', areas: ['GRA Onitsha', 'Fegge', '3-3 Nkwelle', 'Upper Iweka', 'Awada', 'Woliwo'] },
          { name: 'Nnewi', areas: ['Otolo Nnewi', 'Umudim', 'Uruagu', 'Nnewichi'] },
          { name: 'Ekwulobia', areas: ['Ekwulobia Urban', 'Federal Poly Axis'] }
        ]
      },
      {
        name: 'Delta State',
        cities: [
          { name: 'Asaba', areas: ['GRA Asaba', 'Okpanam Road', 'Nnebisi Road', 'Cable Point', 'Anwai Road', 'Core Area'] },
          { name: 'Warri & Effurun', areas: ['Effurun', 'Enerhen', 'GRA Warri', 'Airport Road Warri', 'PTI Road', 'Ogunu', 'Edjeba'] },
          { name: 'Sapele & Agbor', areas: ['Sapele Town', 'Agbor Obi', 'Boji Boji Owa'] },
          { name: 'Ughelli', areas: ['Ughelli Central', 'Otovwodo'] }
        ]
      },
      {
        name: 'Ogun State',
        cities: [
          { name: 'Abeokuta', areas: ['Ibara GRA', 'Oke-Mosan', 'Kuto', 'Ibara Housing Estate', 'Onikolobo', 'Adigbe', 'Ita-Eko'] },
          { name: 'Ota & Border Towns', areas: ['Arepo Estate', 'Mowe', 'Ibafo', 'Ota Industrial Estate', 'Sango Ota', 'Agbara Estate'] },
          { name: 'Ijebu-Ode', areas: ['GRA Ijebu Ode', 'Igbeba', 'Molipa'] },
          { name: 'Sagamu', areas: ['GRA Sagamu', 'Sabon Gari Sagamu', 'Makun'] }
        ]
      },
      {
        name: 'Edo State',
        cities: [
          { name: 'Benin City', areas: ['GRA Benin', 'Uselu', 'Airport Road Benin', 'Sapele Road Benin', 'Ekenwan Road', 'Ring Road', 'Upper Sakponba', 'Ikpoba Hill'] },
          { name: 'Ekpoma & Auchi', areas: ['Ambrose Alli University Axis', 'Auchi Central', 'Sabo Auchi'] },
          { name: 'Uromi', areas: ['Uromi Central', 'Market Road'] }
        ]
      },
      {
        name: 'Kaduna State',
        cities: [
          { name: 'Kaduna South & North', areas: ['Barnawa', 'Malali GRA', 'Kaduna GRA', 'Sabon Tasha', 'Narayi', 'Ungwan Rimi', 'Kabala Costain', 'Kakuri'] },
          { name: 'Zaria', areas: ['Samaru (ABU Axis)', 'Sabon Gari Zaria', 'Tudun Wada Zaria', 'Zaria City'] },
          { name: 'Kafanchan', areas: ['Kafanchan Urban', 'College Road'] }
        ]
      },
      {
        name: 'Akwa Ibom State',
        cities: [
          { name: 'Uyo', areas: ['Ewet Housing Estate', 'Osongama Estate', 'Shelter Afrique', 'Udoudoma Avenue', 'Aka Road', 'Abak Road', 'Ikot Ekpene Road'] },
          { name: 'Eket & Oron', areas: ['Eket Housing', 'Qua Iboe Axis', 'Oron Beach Road'] },
          { name: 'Ikot Ekpene', areas: ['Ikot Ekpene Plaza', 'Abak Road Axis'] }
        ]
      },
      {
        name: 'Cross River State',
        cities: [
          { name: 'Calabar', areas: ['State Housing Estate', 'Federal Housing', 'Calabar GRA', 'Marian Road', 'Calabar South', 'Murtala Mohammed Highway'] },
          { name: 'Ikom & Ogoja', areas: ['Ikom Town', 'Ogoja Urban'] },
          { name: 'Obudu', areas: ['Obudu Town', 'Cattle Ranch Route'] }
        ]
      },
      {
        name: 'Kwara State',
        cities: [
          { name: 'Ilorin', areas: ['GRA Ilorin', 'Fate Road', 'Tanke (Unilorin Axis)', 'Taiwo Road', 'Offa Garage', 'Adewole Housing Estate', 'Challenge Ilorin'] },
          { name: 'Offa', areas: ['Offa Town', 'Federal Poly Axis'] },
          { name: 'Omu-Aran', areas: ['Landmark Univ Axis', 'Central Omu-Aran'] }
        ]
      },
      {
        name: 'Ondo State',
        cities: [
          { name: 'Akure', areas: ['Alagbaka GRA', 'Ijapo Estate', 'Oba Ile', 'Ondo Road Akure', 'FUTA Axis'] },
          { name: 'Ondo Town', areas: ['Ondo GRA', 'Yaba Ondo', 'Oke-Ogbo'] },
          { name: 'Owo & Ikare', areas: ['Owo Central', 'Ikare-Akoko Market'] }
        ]
      },
      {
        name: 'Osun State',
        cities: [
          { name: 'Osogbo', areas: ['Alekuwodo', 'Ogo-Oluwa', 'GRA Osogbo', 'Gbongan Road', 'Powerline'] },
          { name: 'Ile-Ife', areas: ['OAU Campus Axis', 'Mayfair', 'Asherifa', 'Lagere', 'Parakin'] },
          { name: 'Ede & Ilesa', areas: ['Federal Poly Ede Area', 'Ilesa Central', 'Roundabout'] }
        ]
      },
      {
        name: 'Imo State',
        cities: [
          { name: 'Owerri', areas: ['Ikenegbu Layout', 'World Bank Housing Estate', 'Owerri GRA', 'New Owerri', 'Orji (FUTO/IMSIAxis)', 'Works Layout', 'Douglas Road'] },
          { name: 'Orlu', areas: ['Orlu Town', 'Banana Junction'] },
          { name: 'Okigwe', areas: ['Okigwe Urban', 'Expressway Axis'] }
        ]
      },
      {
        name: 'Abia State',
        cities: [
          { name: 'Umuahia', areas: ['World Bank Umuahia', 'GRA Umuahia', 'Bank Road', 'Bende Road'] },
          { name: 'Aba', areas: ['Aba GRA', 'Faulks Road', 'Ariaria Market Axis', 'Ogbor Hill', 'Umungasi'] },
          { name: 'Ohafia', areas: ['Ohafia Urban', 'Asaga'] }
        ]
      },
      {
        name: 'Benue State',
        cities: [
          { name: 'Makurdi', areas: ['High Level', 'Wurukum', 'GRA Makurdi', 'North Bank', 'Kanshio'] },
          { name: 'Gboko', areas: ['Gboko Central', 'Yandev'] },
          { name: 'Otukpo', areas: ['Otukpo Town', 'Enugu Road'] }
        ]
      },
      {
        name: 'Plateau State',
        cities: [
          { name: 'Jos & Bukuru', areas: ['Rayfield GRA', 'Anglo Jos', 'Lamingo', 'Bukuru', 'Jos Main Market Axis', 'Farin Gada (UNIJOS Axis)'] },
          { name: 'Pankshin', areas: ['Pankshin Urban', 'Federal College Area'] }
        ]
      },
      {
        name: 'Katsina State',
        cities: [
          { name: 'Katsina City', areas: ['GRA Katsina', 'Kofar Kaura', 'Dutsin-Ma Road', 'Kofar Kwaya'] },
          { name: 'Daura & Funtua', areas: ['Daura Central', 'Funtua Express'] }
        ]
      },
      {
        name: 'Sokoto State',
        cities: [
          { name: 'Sokoto City', areas: ['GRA Sokoto', 'Guiwa Lowcost', 'Runjin Sambo', 'Gawon Nama', 'Sultan Palace Axis'] }
        ]
      },
      {
        name: 'Bayelsa State',
        cities: [
          { name: 'Yenagoa', areas: ['Amarata', 'Ovom', 'Onopa', 'GRA Yenagoa', 'Kpansia', 'Opolo'] }
        ]
      },
      {
        name: 'Kogi State',
        cities: [
          { name: 'Lokoja', areas: ['GRA Lokoja', 'Ganaja Village', 'Lokongoma Phase 1 & 2', 'Adankolo'] },
          { name: 'Okene & Anyigba', areas: ['Okene Central', 'Anyigba (KSU Axis)'] }
        ]
      },
      {
        name: 'Ekiti State',
        cities: [
          { name: 'Ado-Ekiti', areas: ['GRA Ado Ekiti', 'Adebayo', 'Nova', 'Ajilosun', 'Ikere Road'] },
          { name: 'Ikere & Oye', areas: ['Ikere Town', 'Oye-Ekiti (FUOYE Axis)'] }
        ]
      },
      {
        name: 'Nasarawa State',
        cities: [
          { name: 'Lafia', areas: ['GRA Lafia', 'College of Agriculture Axis', 'Tudun Gwandara'] },
          { name: 'Karu & Mararaba', areas: ['Mararaba', 'Nyanya Border', 'Masaka', 'New Karu', 'Keffi Town'] }
        ]
      },
      {
        name: 'Borno State',
        cities: [
          { name: 'Maiduguri', areas: ['GRA Maiduguri', 'Bulumkutu', 'Post Office Axis', 'University of Maiduguri Axis', 'Gomari'] }
        ]
      },
      {
        name: 'Bauchi State',
        cities: [
          { name: 'Bauchi City', areas: ['GRA Bauchi', 'Yelwa (ATBU Axis)', 'Ahmadu Bello Way', 'Federal Lowcost'] }
        ]
      },
      {
        name: 'Adamawa State',
        cities: [
          { name: 'Yola', areas: ['Jimeta GRA', 'Yola Town', 'Karewa', 'Dougirei', 'Bekaji'] },
          { name: 'Mubi', areas: ['Mubi Urban', 'Federal Poly Axis'] }
        ]
      },
      {
        name: 'Zamfara State',
        cities: [
          { name: 'Gusau', areas: ['GRA Gusau', 'Canteen Area', 'Samaru Gusau'] }
        ]
      },
      {
        name: 'Kebbi State',
        cities: [
          { name: 'Birnin Kebbi', areas: ['GRA Birnin Kebbi', 'Dukku Barracks Axis', 'Bayan Kara'] }
        ]
      },
      {
        name: 'Taraba State',
        cities: [
          { name: 'Jalingo', areas: ['GRA Jalingo', 'Mile Six', 'Magami', 'Dorowa'] }
        ]
      },
      {
        name: 'Gombe State',
        cities: [
          { name: 'Gombe City', areas: ['GRA Gombe', 'Tumfure', 'Commercial Area', 'Federal Lowcost Gombe'] }
        ]
      },
      {
        name: 'Niger State',
        cities: [
          { name: 'Minna', areas: ['GRA Minna', 'Bosso (FUTMinna Axis)', 'Tunga', 'Chanchaga'] },
          { name: 'Suleja', areas: ['Suleja Town', 'Madalla'] }
        ]
      },
      {
        name: 'Yobe State',
        cities: [
          { name: 'Damaturu', areas: ['GRA Damaturu', 'Gujba Road', 'Nayinawa'] }
        ]
      },
      {
        name: 'Jigawa State',
        cities: [
          { name: 'Dutse & Hadejia', areas: ['GRA Dutse', 'Takur Site', 'Federal University Axis', 'Hadejia Town'] }
        ]
      },
      {
        name: 'Ebonyi State',
        cities: [
          { name: 'Abakaliki', areas: ['CAS Campus Axis', 'Azuiyiokwu', 'Mile 50', 'Presco', 'Kpirikpiri'] }
        ]
      }
    ]
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    phoneCode: '+34',
    majorStates: ['Community of Madrid', 'Catalonia', 'Andalusia', 'Valencian Community', 'Basque Country', 'Galicia', 'Balearic Islands', 'Canary Islands'],
    popularCities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Malaga', 'Bilbao', 'Zaragoza', 'Alicante', 'Palma de Mallorca', 'Las Palmas'],
    stateHierarchy: [
      {
        name: 'Community of Madrid',
        cities: [
          { name: 'Madrid', areas: ['Salamanca', 'Malasaña', 'Retiro', 'Chamberí', 'Sol - Centro', 'Moncloa-Aravaca', 'Chamartín', 'Tetuán', 'Arganzuela', 'Vallecas'] },
          { name: 'Alcobendas & Sanse', areas: ['La Moraleja', 'El Encinar de los Reyes', 'Alcobendas Centro', 'San Sebastián de los Reyes'] },
          { name: 'Pozuelo & Majadahonda', areas: ['Pozuelo de Alarcón', 'Monteclaro', 'Majadahonda Centro', 'Las Rozas de Madrid'] },
          { name: 'Getafe & Leganés', areas: ['Getafe Central', 'El Bercial', 'Leganés Central', 'Zarzaquemada'] }
        ]
      },
      {
        name: 'Catalonia',
        cities: [
          { name: 'Barcelona', areas: ['Eixample Esquerra', 'Eixample Dret', 'Gràcia', 'Barceloneta', 'El Born', 'Barri Gòtic', 'Poblenou', 'Sarrià - Sant Gervasi', 'Les Corts', 'Sants'] },
          { name: 'Badalona & Hospitalet', areas: ['Hospitalet de Llobregat', 'Badalona Centre', 'Gornal', 'Bellvitge'] },
          { name: 'Sitges & Costa Garraf', areas: ['Sitges Centre', 'Terramar', 'Levantina', 'Castelldefels Platja'] }
        ]
      },
      {
        name: 'Andalusia',
        cities: [
          { name: 'Seville', areas: ['Barrio Santa Cruz', 'Triana', 'Nervión', 'Macarena', 'Los Remedios', 'Alameda'] },
          { name: 'Málaga & Costa del Sol', areas: ['Centro Histórico', 'La Malagueta', 'Teatinos', 'Marbella Puerto Banús', 'Estepona', 'Benalmádena', 'Fuengirola'] }
        ]
      },
      {
        name: 'Valencian Community',
        cities: [
          { name: 'Valencia', areas: ['Ruzafa', 'El Carmen', 'Ciutat Vella', 'Eshampla', 'El Cabanyal', 'Algirós'] },
          { name: 'Alicante & Costa Blanca', areas: ['Postiguet Beach', 'Playa de San Juan', 'Benidorm Centre'] }
        ]
      },
      {
        name: 'Basque Country',
        cities: [
          { name: 'Bilbao & San Sebastián', areas: ['Abando', 'Casco Viejo', 'Indautxu', 'La Concha Beach San Sebastián'] }
        ]
      },
      {
        name: 'Balearic Islands',
        cities: [
          { name: 'Palma de Mallorca & Ibiza', areas: ['Santa Catalina', 'Old Town Palma', 'Ibiza Town', 'Sant Antoni'] }
        ]
      },
      {
        name: 'Canary Islands',
        cities: [
          { name: 'Las Palmas & Tenerife', areas: ['Las Canteras Beach', 'Vegueta', 'Santa Cruz de Tenerife', 'Costa Adeje'] }
        ]
      }
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    phoneCode: '+44',
    majorStates: ['Greater London', 'Greater Manchester', 'West Midlands', 'Scotland', 'Wales', 'Northern Ireland', 'West Yorkshire', 'Merseyside'],
    popularCities: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Bristol', 'Leeds', 'Liverpool', 'Cardiff', 'Belfast'],
    stateHierarchy: [
      {
        name: 'Greater London',
        cities: [
          { name: 'Central & West London', areas: ['Mayfair', 'Kensington', 'Chelsea', 'Notting Hill', 'Soho', 'Westminster', 'Marylebone', 'Fulham', 'Chiswick'] },
          { name: 'East & North London', areas: ['Shoreditch', 'Hackney', 'Canary Wharf', 'Stratford', 'Islington', 'Camden Town', 'Hampstead', 'Greenwich'] },
          { name: 'South London', areas: ['Brixton', 'Clapham', 'Wimbledon', 'Richmond', 'Battersea', 'Peckham'] }
        ]
      },
      {
        name: 'Greater Manchester',
        cities: [
          { name: 'Manchester', areas: ['Northern Quarter', 'Ancoats', 'Spinningfields', 'Deansgate', 'Castlefield', 'Salford Quays', 'Didsbury', 'Chorlton'] }
        ]
      },
      {
        name: 'West Midlands',
        cities: [
          { name: 'Birmingham', areas: ['Jewellery Quarter', 'Digbeth', 'Edgbaston', 'Moseley', 'Sutton Coldfield', 'City Centre'] }
        ]
      },
      {
        name: 'Scotland',
        cities: [
          { name: 'Edinburgh', areas: ['Old Town', 'New Town', 'Leith', 'Stockbridge', 'Bruntsfield', 'Morningside'] },
          { name: 'Glasgow', areas: ['West End', 'Merchant City', 'Finnieston', 'Shawlands', 'Kelvinside'] }
        ]
      },
      {
        name: 'Merseyside & West Yorkshire',
        cities: [
          { name: 'Liverpool', areas: ['Ropewalks', 'Baltic Triangle', 'Waterfront', 'Albert Dock', 'Aigburth'] },
          { name: 'Leeds', areas: ['Headingley', 'Chapel Allerton', 'City Centre', 'Roundhay'] }
        ]
      }
    ]
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    phoneCode: '+49',
    majorStates: ['Berlin', 'Bavaria', 'North Rhine-Westphalia', 'Baden-Württemberg', 'Hesse', 'Hamburg', 'Saxony', 'Lower Saxony'],
    popularCities: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Düsseldorf', 'Stuttgart', 'Leipzig', 'Dresden'],
    stateHierarchy: [
      {
        name: 'Berlin',
        cities: [
          { name: 'Berlin', areas: ['Mitte', 'Kreuzberg', 'Neukölln', 'Prenzlauer Berg', 'Friedrichshain', 'Charlottenburg', 'Schöneberg', 'Moabit'] }
        ]
      },
      {
        name: 'Bavaria',
        cities: [
          { name: 'Munich', areas: ['Altstadt-Lehel', 'Schwabing', 'Maxvorstadt', 'Glockenbachviertel', 'Bogenhausen', 'Sendling'] }
        ]
      },
      {
        name: 'North Rhine-Westphalia',
        cities: [
          { name: 'Cologne & Düsseldorf', areas: ['Ehrenfeld Cologne', 'Belgisches Viertel', 'Altstadt Düsseldorf', 'Medienhafen', 'Oberkassel'] }
        ]
      },
      {
        name: 'Hesse',
        cities: [
          { name: 'Frankfurt', areas: ['Westend', 'Nordend', 'Sachsenhausen', 'Bornheim', 'Bahnhofsviertel'] }
        ]
      }
    ]
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    phoneCode: '+1',
    majorStates: ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington', 'Massachusetts', 'Georgia', 'Pennsylvania', 'Colorado'],
    popularCities: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Austin', 'San Francisco', 'Seattle', 'Boston', 'Atlanta', 'Denver'],
    stateHierarchy: [
      {
        name: 'New York',
        cities: [
          { name: 'New York City', areas: ['Manhattan (SoHo, Upper East Side, Tribeca, Harlem)', 'Brooklyn (Williamsburg, DUMBO, Bushwick)', 'Queens (Astoria, Long Island City)', 'The Bronx', 'Staten Island'] }
        ]
      },
      {
        name: 'California',
        cities: [
          { name: 'Los Angeles', areas: ['Santa Monica', 'Venice Beach', 'Beverly Hills', 'Hollywood', 'Downtown LA', 'Pasadena', 'Silver Lake'] },
          { name: 'San Francisco', areas: ['Mission District', 'SoMa', 'Pacific Heights', 'Marina', 'North Beach', 'Nob Hill'] }
        ]
      },
      {
        name: 'Florida',
        cities: [
          { name: 'Miami', areas: ['South Beach', 'Wynwood', 'Brickell', 'Coconut Grove', 'Coral Gables', 'Design District'] }
        ]
      },
      {
        name: 'Texas',
        cities: [
          { name: 'Austin & Houston', areas: ['South Congress Austin', 'East Austin', 'Downtown Houston', 'The Heights Houston', 'Montrose'] }
        ]
      },
      {
        name: 'Illinois',
        cities: [
          { name: 'Chicago', areas: ['The Loop', 'Lincoln Park', 'Wicker Park', 'River North', 'Logan Square', 'Hyde Park'] }
        ]
      }
    ]
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    phoneCode: '+33',
    majorStates: ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Occitanie', 'Nouvelle-Aquitaine', 'Hauts-de-France'],
    popularCities: ['Paris', 'Lyon', 'Marseille', 'Nice', 'Toulouse', 'Bordeaux', 'Lille', 'Nantes', 'Strasbourg'],
    stateHierarchy: [
      {
        name: 'Île-de-France',
        cities: [
          { name: 'Paris', areas: ['Le Marais (1st-4th Arr.)', 'Quartier Latin (5th)', 'Saint-Germain-des-Prés (6th)', 'Eiffel Tower Area (7th)', 'Champs-Élysées (8th)', 'Montmartre (18th)', 'Belleville (20th)'] }
        ]
      },
      {
        name: 'Provence-Alpes-Côte d\'Azur',
        cities: [
          { name: 'Nice & Marseille', areas: ['Promenade des Anglais Nice', 'Le Vieux-Port Marseille', 'Le Panier', 'Cannes Croisette'] }
        ]
      }
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    phoneCode: '+1',
    majorStates: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Nova Scotia', 'Manitoba', 'Saskatchewan'],
    popularCities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Halifax', 'Winnipeg'],
    stateHierarchy: [
      {
        name: 'Ontario',
        cities: [
          { name: 'Toronto', areas: ['Downtown Toronto', 'Yorkville', 'Kensington Market', 'Liberty Village', 'Leslieville', 'North York', 'Scarborough', 'Mississauga'] },
          { name: 'Ottawa', areas: ['ByWard Market', 'The Glebe', 'Centretown', 'Westboro'] }
        ]
      },
      {
        name: 'British Columbia',
        cities: [
          { name: 'Vancouver', areas: ['Downtown Vancouver', 'Yaletown', 'Kitsilano', 'Gastown', 'West End', 'Burnaby', 'Richmond'] }
        ]
      },
      {
        name: 'Quebec',
        cities: [
          { name: 'Montreal', areas: ['Old Montreal', 'Le Plateau-Mont-Royal', 'Mile End', 'Downtown Montreal', 'Griffintown'] }
        ]
      }
    ]
  },
  {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    phoneCode: '+39',
    majorStates: ['Lazio', 'Lombardy', 'Tuscany', 'Veneto', 'Campania', 'Piedmont', 'Emilia-Romagna', 'Sicily'],
    popularCities: ['Rome', 'Milan', 'Florence', 'Venice', 'Naples', 'Turin', 'Bologna', 'Palermo'],
    stateHierarchy: [
      {
        name: 'Lazio',
        cities: [
          { name: 'Rome', areas: ['Trastevere', 'Centro Storico', 'Prati', 'Monti', 'Testaccio', 'EUR'] }
        ]
      },
      {
        name: 'Lombardy',
        cities: [
          { name: 'Milan', areas: ['Brera', 'Navigli', 'Porta Nuova', 'Isola', 'Duomo Centre', 'Porta Romana'] }
        ]
      }
    ]
  },
  {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    phoneCode: '+31',
    majorStates: ['North Holland', 'South Holland', 'Utrecht', 'North Brabant', 'Gelderland'],
    popularCities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen'],
    stateHierarchy: [
      {
        name: 'North Holland',
        cities: [
          { name: 'Amsterdam', areas: ['Jordaan', 'De Pijp', 'Amsterdam-Centrum', 'Oud-West', 'Zuidas', 'Amsterdam-Noord'] }
        ]
      }
    ]
  },
  {
    code: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    phoneCode: '+351',
    majorStates: ['Lisbon District', 'Porto District', 'Faro (Algarve)', 'Braga', 'Setúbal', 'Coimbra'],
    popularCities: ['Lisbon', 'Porto', 'Faro', 'Braga', 'Coimbra', 'Cascais'],
    stateHierarchy: [
      {
        name: 'Lisbon District',
        cities: [
          { name: 'Lisbon', areas: ['Alfama', 'Chiado', 'Bairro Alto', 'Principe Real', 'Parque das Nações', 'Belém', 'Cascais'] }
        ]
      },
      {
        name: 'Porto District',
        cities: [
          { name: 'Porto', areas: ['Ribeira', 'Foz do Douro', 'Cedofeita', 'Bonfim', 'Vila Nova de Gaia'] }
        ]
      }
    ]
  },
  {
    code: 'IE',
    name: 'Ireland',
    flag: '🇮🇪',
    phoneCode: '+353',
    majorStates: ['County Dublin', 'County Cork', 'County Galway', 'County Limerick', 'County Waterford'],
    popularCities: ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford'],
    stateHierarchy: [
      {
        name: 'County Dublin',
        cities: [
          { name: 'Dublin', areas: ['Temple Bar', 'Ranelagh', 'Ballsbridge', 'Portobello', 'Clontarf', 'Rathmines'] }
        ]
      }
    ]
  },
  {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    phoneCode: '+233',
    majorStates: ['Greater Accra', 'Ashanti Region', 'Central Region', 'Western Region', 'Eastern Region', 'Northern Region'],
    popularCities: ['Accra', 'Kumasi', 'Cape Coast', 'Takoradi', 'Tema', 'Tamale'],
    stateHierarchy: [
      {
        name: 'Greater Accra',
        cities: [
          { name: 'Accra', areas: ['East Legon', 'Cantonments', 'Osu', 'Airport Residential', 'Spintex', 'Labone', 'Dzorwulu', 'Ridge'] },
          { name: 'Tema', areas: ['Community 1 - 12', 'Tema Comm 25', 'Sakumono'] }
        ]
      },
      {
        name: 'Ashanti Region',
        cities: [
          { name: 'Kumasi', areas: ['Nhyiaeso', 'Asokwa', 'Ahodwo', 'KNUST Campus Axis', 'Bantama'] }
        ]
      }
    ]
  },
  {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    phoneCode: '+254',
    majorStates: ['Nairobi County', 'Mombasa County', 'Nakuru County', 'Kisumu County', 'Uasin Gishu County', 'Kiambu County'],
    popularCities: ['Nairobi', 'Mombasa', 'Nakuru', 'Kisumu', 'Eldoret', 'Thika'],
    stateHierarchy: [
      {
        name: 'Nairobi County',
        cities: [
          { name: 'Nairobi', areas: ['Kilimani', 'Westlands', 'Lavington', 'Karen', 'Kileleshwa', 'Upper Hill', 'Parklands', 'Gigiri'] }
        ]
      },
      {
        name: 'Mombasa County',
        cities: [
          { name: 'Mombasa', areas: ['Nyali', 'Bamburi', 'Tudor', 'Mombasa Island', 'Shanzu'] }
        ]
      }
    ]
  },
  {
    code: 'ZA',
    name: 'South Africa',
    flag: '🇿🇦',
    phoneCode: '+27',
    majorStates: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Mpumalanga'],
    popularCities: ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Gqeberha', 'Bloemfontein'],
    stateHierarchy: [
      {
        name: 'Western Cape',
        cities: [
          { name: 'Cape Town', areas: ['Camps Bay', 'Sea Point', 'Green Point', 'Constantia', 'CBD', 'Woodstock', 'Claremont'] }
        ]
      },
      {
        name: 'Gauteng',
        cities: [
          { name: 'Johannesburg & Sandton', areas: ['Sandton', 'Rosebank', 'Midrand', 'Soweto', 'Fourways', 'Melville'] },
          { name: 'Pretoria', areas: ['Menlyn', 'Brooklyn', 'Hatfield', 'Centurion'] }
        ]
      }
    ]
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    phoneCode: '+971',
    majorStates: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah'],
    popularCities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
    stateHierarchy: [
      {
        name: 'Dubai',
        cities: [
          { name: 'Dubai City', areas: ['Dubai Marina', 'Downtown Dubai', 'Palm Jumeirah', 'Business Bay', 'Jumeirah Beach Residence (JBR)', 'Jumeirah Village Circle (JVC)', 'Dubai Hills'] }
        ]
      },
      {
        name: 'Abu Dhabi',
        cities: [
          { name: 'Abu Dhabi City', areas: ['Corniche', 'Al Reem Island', 'Yas Island', 'Saadiyat Island', 'Al Raha'] }
        ]
      }
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    phoneCode: '+61',
    majorStates: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania'],
    popularCities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Hobart'],
    stateHierarchy: [
      {
        name: 'New South Wales',
        cities: [
          { name: 'Sydney', areas: ['Bondi Beach', 'Surry Hills', 'Manly', 'Paddington', 'Sydney CBD', 'Darlinghurst', 'Parramatta'] }
        ]
      },
      {
        name: 'Victoria',
        cities: [
          { name: 'Melbourne', areas: ['Fitzroy', 'St Kilda', 'Southbank', 'Carlton', 'Richmond', 'South Yarra', 'Brunswick'] }
        ]
      }
    ]
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    phoneCode: '+91',
    majorStates: ['Maharashtra', 'Karnataka', 'Delhi NCT', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Gujarat'],
    popularCities: ['Mumbai', 'Bengaluru', 'New Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'],
    stateHierarchy: [
      {
        name: 'Maharashtra',
        cities: [
          { name: 'Mumbai', areas: ['Bandra West', 'Juhu', 'South Mumbai (Colaba)', 'Powai', 'Worli', 'Andheri West'] },
          { name: 'Pune', areas: ['Koregaon Park', 'Baner', 'Kothrud', 'Viman Nagar'] }
        ]
      },
      {
        name: 'Karnataka',
        cities: [
          { name: 'Bengaluru', areas: ['Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout', 'Jayanagar', 'MG Road'] }
        ]
      }
    ]
  },
  {
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    phoneCode: '+55',
    majorStates: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Paraná', 'Rio Grande do Sul'],
    popularCities: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Brasília', 'Curitiba'],
    stateHierarchy: [
      {
        name: 'São Paulo',
        cities: [
          { name: 'São Paulo City', areas: ['Jardins', 'Pinheiros', 'Itaim Bibi', 'Vila Madalena', 'Moema', 'Paulista'] }
        ]
      },
      {
        name: 'Rio de Janeiro',
        cities: [
          { name: 'Rio de Janeiro City', areas: ['Ipanema', 'Copacabana', 'Leblon', 'Botafogo', 'Santa Teresa', 'Barra da Tijuca'] }
        ]
      }
    ]
  },
  {
    code: 'MX',
    name: 'Mexico',
    flag: '🇲🇽',
    phoneCode: '+52',
    majorStates: ['Mexico City', 'Jalisco', 'Nuevo León', 'Quintana Roo', 'Puebla', 'Yucatán'],
    popularCities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Cancún', 'Puebla', 'Mérida'],
    stateHierarchy: [
      {
        name: 'Mexico City',
        cities: [
          { name: 'Mexico City', areas: ['Polanco', 'Condesa', 'Roma Norte', 'Santa Fe', 'Coyoacán', 'Juárez'] }
        ]
      }
    ]
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    phoneCode: '+81',
    majorStates: ['Tokyo Metropolis', 'Osaka Prefecture', 'Kyoto Prefecture', 'Kanagawa', 'Aichi', 'Hokkaido'],
    popularCities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo'],
    stateHierarchy: [
      {
        name: 'Tokyo Metropolis',
        cities: [
          { name: 'Tokyo', areas: ['Shibuya', 'Shinjuku', 'Minato (Roppongi)', 'Ginza', 'Akihabara', 'Asakusa', 'Ebisu', 'Harajuku'] }
        ]
      },
      {
        name: 'Osaka Prefecture',
        cities: [
          { name: 'Osaka', areas: ['Umeda', 'Namba', 'Shinsaibashi', 'Dotonbori', 'Abeno'] }
        ]
      }
    ]
  }
];

/**
 * Return list of states for a country, guaranteeing complete coverage
 */
export function getStatesForCountry(countryName: string): string[] {
  const countryObj = GLOBAL_COUNTRIES.find(c => c.name.toLowerCase() === countryName.toLowerCase());
  if (!countryObj) return [];

  const stateSet = new Set<string>();

  // Add states from hierarchy first
  if (countryObj.stateHierarchy && countryObj.stateHierarchy.length > 0) {
    countryObj.stateHierarchy.forEach(s => stateSet.add(s.name));
  }

  // Add majorStates so no official state is missing
  if (countryObj.majorStates && countryObj.majorStates.length > 0) {
    countryObj.majorStates.forEach(s => stateSet.add(s));
  }

  return Array.from(stateSet);
}

/**
 * Return list of cities for a given country and state
 */
export function getCitiesForState(countryName: string, stateName: string): string[] {
  const countryObj = GLOBAL_COUNTRIES.find(c => c.name.toLowerCase() === countryName.toLowerCase());
  if (!countryObj) return [];

  // If state is 'all' or empty, return all unique cities across stateHierarchy + popularCities
  if (!stateName || stateName === 'all') {
    const citySet = new Set<string>();
    if (countryObj.stateHierarchy) {
      countryObj.stateHierarchy.forEach(st => {
        st.cities.forEach(c => citySet.add(c.name));
      });
    }
    countryObj.popularCities.forEach(c => {
      const cleanName = c.split(' (')[0].trim();
      citySet.add(cleanName);
    });
    return Array.from(citySet);
  }

  // Clean state string for comparison
  const cleanState = stateName.toLowerCase()
    .replace(/state|territory|county|region|province|district|prefecture|metropolis/gi, '')
    .trim();

  if (countryObj.stateHierarchy) {
    const stateObj = countryObj.stateHierarchy.find(s => {
      const sClean = s.name.toLowerCase()
        .replace(/state|territory|county|region|province|district|prefecture|metropolis/gi, '')
        .trim();
      return sClean === cleanState || s.name.toLowerCase().includes(cleanState) || cleanState.includes(sClean);
    });

    if (stateObj && stateObj.cities.length > 0) {
      return stateObj.cities.map(c => c.name);
    }
  }

  // Fallback: search popularCities
  const cleanStateName = stateName.replace(/ (State|County|Region|Province|Territory|District|Prefecture)/gi, '').trim();
  const filteredPopular = countryObj.popularCities.filter(c => c.toLowerCase().includes(cleanStateName.toLowerCase()));
  if (filteredPopular.length > 0) {
    return filteredPopular.map(c => c.split(' (')[0].trim());
  }

  // Final fallback to clean state name as city
  return [cleanStateName];
}

/**
 * Return list of neighborhood areas for a given city in a state.
 * If cityName is 'all', returns all areas within the selected state or country.
 */
export function getAreasForCity(countryName: string, stateName: string, cityName: string): string[] {
  const countryObj = GLOBAL_COUNTRIES.find(c => c.name.toLowerCase() === countryName.toLowerCase());
  if (!countryObj) return [];

  const areaSet = new Set<string>();

  if (countryObj.stateHierarchy) {
    for (const st of countryObj.stateHierarchy) {
      // Check state match if stateName is provided and not 'all'
      if (stateName && stateName !== 'all') {
        const cleanState = stateName.toLowerCase()
          .replace(/state|territory|county|region|province|district|prefecture|metropolis/gi, '')
          .trim();
        const sClean = st.name.toLowerCase()
          .replace(/state|territory|county|region|province|district|prefecture|metropolis/gi, '')
          .trim();
        if (sClean !== cleanState && !st.name.toLowerCase().includes(cleanState) && !cleanState.includes(sClean)) {
          continue; // skip state if not matched
        }
      }

      for (const cityObj of st.cities) {
        if (!cityName || cityName === 'all' || 
            cityObj.name.toLowerCase() === cityName.toLowerCase() || 
            cityName.toLowerCase().includes(cityObj.name.toLowerCase()) ||
            cityObj.name.toLowerCase().includes(cityName.toLowerCase())) {
          if (cityObj.areas && cityObj.areas.length > 0) {
            cityObj.areas.forEach(a => areaSet.add(a));
          }
        }
      }
    }
  }

  // Also extract parenthetical sub-areas from popularCities if relevant
  if (cityName && cityName !== 'all') {
    const popMatch = countryObj.popularCities.find(c => c.toLowerCase().startsWith(cityName.toLowerCase()));
    if (popMatch && popMatch.includes('(') && popMatch.includes(')')) {
      const areasStr = popMatch.substring(popMatch.indexOf('(') + 1, popMatch.indexOf(')'));
      areasStr.split(',').forEach(a => areaSet.add(a.trim()));
    }
  }

  return Array.from(areaSet);
}

/**
 * Filter countries by search term
 */
export function searchCountries(query: string): CountryData[] {
  if (!query || !query.trim()) return GLOBAL_COUNTRIES;
  const q = query.trim().toLowerCase();
  return GLOBAL_COUNTRIES.filter(
    c => c.name.toLowerCase().includes(q) ||
         c.code.toLowerCase().includes(q) ||
         c.phoneCode.includes(q)
  );
}

/**
 * Dynamically return market options based on selected country
 */
export function getDynamicMarketsForCountry(selectedCountryName: string): { label: string; value: string; flag: string; isLaunchRegion: boolean }[] {
  const result: { label: string; value: string; flag: string; isLaunchRegion: boolean }[] = [];

  // Match launch regions for this country first
  LAUNCH_REGIONS.forEach(r => {
    if (r.country.toLowerCase() === selectedCountryName.toLowerCase() || selectedCountryName === 'All' || !selectedCountryName) {
      result.push({
        label: `${r.name}, ${r.country}`,
        value: `${r.name}, ${r.country}`,
        flag: r.flag,
        isLaunchRegion: true
      });
    }
  });

  // Also include popular cities from country data
  const countryObj = GLOBAL_COUNTRIES.find(c => c.name.toLowerCase() === selectedCountryName.toLowerCase());
  if (countryObj) {
    countryObj.popularCities.forEach(city => {
      const existing = result.find(r => r.value.toLowerCase().includes(city.toLowerCase()));
      if (!existing) {
        result.push({
          label: `${city}, ${countryObj.name}`,
          value: `${city}, ${countryObj.name}`,
          flag: countryObj.flag,
          isLaunchRegion: false
        });
      }
    });
  }

  // If no specific country matched, provide global launch regions & top hubs
  if (result.length === 0) {
    LAUNCH_REGIONS.forEach(r => {
      result.push({
        label: `${r.name}, ${r.country}`,
        value: `${r.name}, ${r.country}`,
        flag: r.flag,
        isLaunchRegion: true
      });
    });
  }

  return result;
}

export interface LaunchRegion {
  id: string;
  name: string;
  country: string;
  flag: string;
  center: { lat: number; lng: number };
  zoom: number;
  popularNeighborhoods: string[];
}

export const LAUNCH_REGIONS: LaunchRegion[] = [
  {
    id: 'madrid',
    name: 'Madrid',
    country: 'Spain',
    flag: '🇪🇸',
    center: { lat: 40.4167, lng: -3.7037 },
    zoom: 13,
    popularNeighborhoods: ['Plaza Mayor', 'Sol', 'Salamanca', 'Malasaña', 'Chamberí', 'Retiro', 'Chueca']
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    flag: '🇪🇸',
    center: { lat: 41.3851, lng: 2.1734 },
    zoom: 13,
    popularNeighborhoods: ['Eixample', 'Barceloneta', 'Gràcia', 'El Born', 'Gòtic', 'Poble-Sec', 'Sant Martí']
  },
  {
    id: 'valencia',
    name: 'Valencia',
    country: 'Spain',
    flag: '🇪🇸',
    center: { lat: 39.4699, lng: -0.3763 },
    zoom: 13,
    popularNeighborhoods: ['Ruzafa', 'El Carmen', 'Ciutat Vella', 'Eshampla', 'Algirós', 'El Cabanyal']
  },
  {
    id: 'seville',
    name: 'Seville',
    country: 'Spain',
    flag: '🇪🇸',
    center: { lat: 37.3891, lng: -5.9845 },
    zoom: 13,
    popularNeighborhoods: ['Santa Cruz', 'Triana', 'Macarena', 'Nervión', 'Alameda de Hércules']
  },
  {
    id: 'lagos',
    name: 'Lagos',
    country: 'Nigeria',
    flag: '🇳🇬',
    center: { lat: 6.5244, lng: 3.3792 },
    zoom: 12,
    popularNeighborhoods: ['Victoria Island', 'Ikoyi', 'Lekki Phase 1', 'Ikeja GRA', 'Surulere', 'Yaba']
  },
  {
    id: 'uyo',
    name: 'Uyo',
    country: 'Nigeria',
    flag: '🇳🇬',
    center: { lat: 5.0377, lng: 7.9128 },
    zoom: 13,
    popularNeighborhoods: ['Ewet Housing Estate', 'Osongama Estate', 'Shelter Afrique', 'Udoudoma Avenue', 'Aka Road', 'Abak Road', 'Ikot Ekpene Road']
  },
  {
    id: 'abuja',
    name: 'Abuja',
    country: 'Nigeria',
    flag: '🇳🇬',
    center: { lat: 9.0765, lng: 7.3986 },
    zoom: 12,
    popularNeighborhoods: ['Maitama', 'Asokoro', 'Gwarinpa', 'Wuse 2', 'Jabi', 'Apo']
  },
  {
    id: 'port-harcourt',
    name: 'Port Harcourt',
    country: 'Nigeria',
    flag: '🇳🇬',
    center: { lat: 4.8156, lng: 7.0498 },
    zoom: 12,
    popularNeighborhoods: ['GRA Phase 2', 'Trans Amadi', 'Ada George', 'Rumuogba', 'Old GRA']
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    flag: '🇬🇧',
    center: { lat: 51.5074, lng: -0.1278 },
    zoom: 12,
    popularNeighborhoods: ['Shoreditch', 'Kensington', 'Camden', 'Soho', 'Greenwich', 'Chelsea']
  },
  {
    id: 'berlin',
    name: 'Berlin',
    country: 'Germany',
    flag: '🇩🇪',
    center: { lat: 52.5200, lng: 13.4050 },
    zoom: 12,
    popularNeighborhoods: ['Mitte', 'Kreuzberg', 'Neukölln', 'Prenzlauer Berg', 'Friedrichshain']
  }
];

export const KNOWN_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Nigeria
  'lagos': { lat: 6.5244, lng: 3.3792 },
  'lekki': { lat: 6.4474, lng: 3.4723 },
  'ikeja': { lat: 6.5912, lng: 3.3580 },
  'victoria island': { lat: 6.4281, lng: 3.4219 },
  'ikoyi': { lat: 6.4549, lng: 3.4316 },
  'abuja': { lat: 9.0765, lng: 7.3986 },
  'maitama': { lat: 9.0882, lng: 7.4983 },
  'port harcourt': { lat: 4.8156, lng: 7.0498 },
  'ibadan': { lat: 7.3775, lng: 3.9470 },
  'kano': { lat: 12.0022, lng: 8.5920 },
  'enugu': { lat: 6.4584, lng: 7.5464 },
  'uyo': { lat: 5.0377, lng: 7.9128 },
  'ewet housing estate': { lat: 5.0298, lng: 7.9288 },
  'shelter afrique': { lat: 5.0425, lng: 7.9250 },
  'osongama estate': { lat: 5.0180, lng: 7.9350 },
  'udoudoma avenue': { lat: 5.0250, lng: 7.9180 },
  'aka road': { lat: 5.0310, lng: 7.9050 },
  'abak road': { lat: 5.0350, lng: 7.8920 },
  'ikot ekpene road': { lat: 5.0480, lng: 7.9010 },
  'akwa ibom': { lat: 5.0377, lng: 7.9128 },
  'akwa ibom state': { lat: 5.0377, lng: 7.9128 },
  'calabar': { lat: 4.9757, lng: 8.3417 },
  'benin city': { lat: 6.3350, lng: 5.6037 },
  'asaba': { lat: 6.1983, lng: 6.7277 },
  'nigeria': { lat: 6.5244, lng: 3.3792 },

  // United States
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'beverly hills': { lat: 34.0696, lng: -118.4053 },
  'california': { lat: 34.0522, lng: -118.2437 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  'manhattan': { lat: 40.7549, lng: -73.9840 },
  'miami': { lat: 25.7617, lng: -80.1918 },
  'florida': { lat: 25.7617, lng: -80.1918 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'chicago': { lat: 41.8781, lng: -87.6298 },
  'houston': { lat: 29.7604, lng: -95.3698 },
  'texas': { lat: 29.7604, lng: -95.3698 },
  'united states': { lat: 37.0902, lng: -95.7129 },

  // United Kingdom
  'london': { lat: 51.5074, lng: -0.1278 },
  'greater london': { lat: 51.5074, lng: -0.1278 },
  'manchester': { lat: 53.4808, lng: -2.2426 },
  'birmingham': { lat: 52.4862, lng: -1.8904 },
  'edinburgh': { lat: 55.9533, lng: -3.1883 },
  'united kingdom': { lat: 51.5074, lng: -0.1278 },

  // Canada
  'toronto': { lat: 43.6532, lng: -79.3832 },
  'ontario': { lat: 43.6532, lng: -79.3832 },
  'vancouver': { lat: 49.2827, lng: -123.1207 },
  'montreal': { lat: 45.5017, lng: -73.5673 },
  'canada': { lat: 43.6532, lng: -79.3832 },

  // Germany
  'berlin': { lat: 52.5200, lng: 13.4050 },
  'munich': { lat: 48.1351, lng: 11.5820 },
  'bavaria': { lat: 48.1351, lng: 11.5820 },
  'frankfurt': { lat: 50.1109, lng: 8.6821 },
  'germany': { lat: 52.5200, lng: 13.4050 },

  // Ghana
  'accra': { lat: 5.6037, lng: -0.1870 },
  'cantonments': { lat: 5.5800, lng: -0.1700 },
  'greater accra': { lat: 5.6037, lng: -0.1870 },
  'kumasi': { lat: 6.6885, lng: -1.6244 },
  'ghana': { lat: 5.6037, lng: -0.1870 },

  // Kenya
  'nairobi': { lat: -1.2921, lng: 36.8219 },
  'westlands': { lat: -1.2683, lng: 36.8078 },
  'nairobi county': { lat: -1.2921, lng: 36.8219 },
  'mombasa': { lat: -4.0435, lng: 39.6682 },
  'kenya': { lat: -1.2921, lng: 36.8219 },

  // South Africa
  'cape town': { lat: -33.9249, lng: 18.4241 },
  'sea point': { lat: -33.9142, lng: 18.3881 },
  'johannesburg': { lat: -26.2041, lng: 28.0473 },
  'south africa': { lat: -33.9249, lng: 18.4241 },

  // United Arab Emirates
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'abu dhabi': { lat: 24.4539, lng: 54.3773 },
  'united arab emirates': { lat: 25.2048, lng: 55.2708 },

  // Spain
  'madrid': { lat: 40.4167, lng: -3.7037 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'valencia': { lat: 39.4699, lng: -0.3763 },
  'seville': { lat: 37.3891, lng: -5.9845 },
  'spain': { lat: 40.4167, lng: -3.7037 },

  // France
  'paris': { lat: 48.8566, lng: 2.3522 },
  'france': { lat: 48.8566, lng: 2.3522 },
};

export function getCoordinatesForUserLocation(user?: { country?: string; state?: string; city?: string; streetAddress?: string; preferredMoveInRegion?: string } | null): { lat: number; lng: number } {
  if (!user) return { lat: 6.5244, lng: 3.3792 }; // Lagos default

  const streetKey = user.streetAddress?.toLowerCase().trim();
  const preferredKey = user.preferredMoveInRegion?.toLowerCase().trim();
  const cityKey = user.city?.toLowerCase().trim();
  const stateKey = user.state?.toLowerCase().trim();
  const countryKey = user.country?.toLowerCase().trim();

  // Check exact keys for subtown or preferred market
  if (preferredKey && KNOWN_CITY_COORDINATES[preferredKey]) {
    return KNOWN_CITY_COORDINATES[preferredKey];
  }
  if (streetKey && KNOWN_CITY_COORDINATES[streetKey]) {
    return KNOWN_CITY_COORDINATES[streetKey];
  }

  // Check exact city, state, country
  if (cityKey && KNOWN_CITY_COORDINATES[cityKey]) {
    return KNOWN_CITY_COORDINATES[cityKey];
  }
  if (stateKey && KNOWN_CITY_COORDINATES[stateKey]) {
    return KNOWN_CITY_COORDINATES[stateKey];
  }
  if (countryKey && KNOWN_CITY_COORDINATES[countryKey]) {
    return KNOWN_CITY_COORDINATES[countryKey];
  }

  // Search partial matches for subtown or preferred region
  for (const [key, coords] of Object.entries(KNOWN_CITY_COORDINATES)) {
    if (preferredKey && (preferredKey.includes(key) || key.includes(preferredKey))) return coords;
    if (streetKey && (streetKey.includes(key) || key.includes(streetKey))) return coords;
    if (cityKey && (key.includes(cityKey) || cityKey.includes(key))) return coords;
    if (stateKey && (key.includes(stateKey) || stateKey.includes(key))) return coords;
    if (countryKey && (key.includes(countryKey) || countryKey.includes(key))) return coords;
  }

  // Check launch regions
  const launchMatch = LAUNCH_REGIONS.find(r => 
    (countryKey && r.country.toLowerCase().includes(countryKey)) ||
    (cityKey && r.name.toLowerCase().includes(cityKey)) ||
    (preferredKey && r.name.toLowerCase().includes(preferredKey))
  );
  if (launchMatch) return launchMatch.center;

  return { lat: 6.5244, lng: 3.3792 };
}

/**
 * Calculates straight-line geodesic distance between two points in kilometers (Haversine Formula)
 */
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d * 10) / 10;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export interface GeocodedAddress {
  formattedAddress: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

/**
 * Perform address autocomplete or geocoding search via Nominatim API with instant local fallback
 */
export async function searchAddressSuggestions(query: string): Promise<GeocodedAddress[]> {
  if (!query || query.trim().length < 2) return [];

  const trimmed = query.trim().toLowerCase();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5&addressdetails=1`,
      {
        headers: { 'User-Agent': 'RentoraRealEstateApp/1.0' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => ({
          formattedAddress: item.display_name,
          city: item.address?.city || item.address?.town || item.address?.suburb || item.address?.state || 'Unknown City',
          country: item.address?.country || '',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
      }
    }
  } catch (err) {
    // Network error or timeout, proceed to local smart matching
  }

  // Fallback preset suggestions if offline or search timeout
  const matchingRegions = LAUNCH_REGIONS.filter(
    r => r.name.toLowerCase().includes(trimmed) || r.country.toLowerCase().includes(trimmed) || r.popularNeighborhoods.some(n => n.toLowerCase().includes(trimmed))
  );

  if (matchingRegions.length > 0) {
    return matchingRegions.map(r => ({
      formattedAddress: `${r.name}, ${r.country}`,
      city: r.name,
      country: r.country,
      lat: r.center.lat,
      lng: r.center.lng
    }));
  }

  return [];
}

/**
 * Get current user GPS location using Browser Geolocation API
 */
export function getCurrentUserCoordinates(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}

/**
 * Utility location metadata mapping
 */
export interface ResolvedLocationMeta {
  city?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
  keywords: string[];
}

/**
 * Utility mapping function that maps partial strings, city names (e.g. 'Uyo'),
 * neighborhoods (e.g. 'Ewet Housing Estate'), or state names (e.g. 'Akwa Ibom')
 * to their corresponding canonical city, state, country, geocoordinates, and keyword aliases.
 */
export function resolveLocationMeta(query: string): ResolvedLocationMeta {
  if (!query) return { keywords: [] };
  const trimmed = query.trim().toLowerCase();
  const cleanQuery = trimmed.replace(/state|territory|county|region|province|district|metropolis/gi, '').trim();

  const keywordsSet = new Set<string>();
  keywordsSet.add(trimmed);
  if (cleanQuery) keywordsSet.add(cleanQuery);

  let matchedCity: string | undefined;
  let matchedState: string | undefined;
  let matchedCountry: string | undefined;
  let lat: number | undefined;
  let lng: number | undefined;

  // 1. Direct check in KNOWN_CITY_COORDINATES
  for (const [key, coords] of Object.entries(KNOWN_CITY_COORDINATES)) {
    if (cleanQuery === key || trimmed === key || (cleanQuery.length >= 3 && key.includes(cleanQuery))) {
      lat = coords.lat;
      lng = coords.lng;
      keywordsSet.add(key);
      break;
    }
  }

  // 2. Scan GLOBAL_COUNTRIES stateHierarchy & popularCities
  for (const countryObj of GLOBAL_COUNTRIES) {
    const countryNameLower = countryObj.name.toLowerCase();
    
    // Country match
    if (trimmed === countryNameLower || cleanQuery === countryNameLower) {
      matchedCountry = countryObj.name;
      keywordsSet.add(countryNameLower);
    }

    if (countryObj.stateHierarchy) {
      for (const st of countryObj.stateHierarchy) {
        const stateNameLower = st.name.toLowerCase();
        const stateClean = stateNameLower.replace(/state|territory|county|region|province|district|metropolis/gi, '').trim();

        const isStateMatch = 
          trimmed === stateNameLower || 
          cleanQuery === stateClean || 
          (cleanQuery.length >= 3 && (stateClean.includes(cleanQuery) || cleanQuery.includes(stateClean)));

        if (isStateMatch) {
          matchedState = st.name;
          matchedCountry = countryObj.name;
          keywordsSet.add(stateNameLower);
          keywordsSet.add(stateClean);

          // Add all cities in state
          st.cities.forEach(c => {
            keywordsSet.add(c.name.toLowerCase());
            if (c.areas) c.areas.forEach(a => keywordsSet.add(a.toLowerCase()));
          });
        }

        // Check cities in state
        for (const cityObj of st.cities) {
          const cityNameLower = cityObj.name.toLowerCase();
          const isCityMatch = 
            trimmed === cityNameLower || 
            cleanQuery === cityNameLower ||
            (cleanQuery.length >= 3 && (cityNameLower.includes(cleanQuery) || cleanQuery.includes(cityNameLower)));

          // Check neighborhood areas
          const areaMatch = cityObj.areas?.find(a => 
            a.toLowerCase() === trimmed || 
            a.toLowerCase().includes(cleanQuery) || 
            cleanQuery.includes(a.toLowerCase())
          );

          if (isCityMatch || areaMatch) {
            matchedCity = cityObj.name;
            matchedState = st.name;
            matchedCountry = countryObj.name;

            keywordsSet.add(cityNameLower);
            keywordsSet.add(stateNameLower);
            keywordsSet.add(stateClean);
            keywordsSet.add(countryNameLower);

            if (cityObj.areas) {
              cityObj.areas.forEach(a => keywordsSet.add(a.toLowerCase()));
            }
          }
        }
      }
    }

    // Check popularCities
    if (!matchedCity) {
      const popCityMatch = countryObj.popularCities.find(c => {
        const cClean = c.split(' (')[0].trim().toLowerCase();
        return cClean === cleanQuery || cClean === trimmed || (cleanQuery.length >= 3 && cClean.includes(cleanQuery));
      });

      if (popCityMatch) {
        const cleanPopCity = popCityMatch.split(' (')[0].trim();
        matchedCity = cleanPopCity;
        matchedCountry = countryObj.name;
        keywordsSet.add(cleanPopCity.toLowerCase());
        keywordsSet.add(countryNameLower);
      }
    }
  }

  // Fallback to LAUNCH_REGIONS
  const launchMatch = LAUNCH_REGIONS.find(r => 
    r.name.toLowerCase() === cleanQuery || 
    r.id === cleanQuery || 
    r.popularNeighborhoods.some(n => n.toLowerCase().includes(cleanQuery))
  );
  if (launchMatch) {
    if (!matchedCity) matchedCity = launchMatch.name;
    if (!matchedCountry) matchedCountry = launchMatch.country;
    if (!lat) lat = launchMatch.center.lat;
    if (!lng) lng = launchMatch.center.lng;
    keywordsSet.add(launchMatch.name.toLowerCase());
    keywordsSet.add(launchMatch.country.toLowerCase());
    launchMatch.popularNeighborhoods.forEach(n => keywordsSet.add(n.toLowerCase()));
  }

  return {
    city: matchedCity,
    state: matchedState,
    country: matchedCountry,
    lat,
    lng,
    keywords: Array.from(keywordsSet)
  };
}

/**
 * Helper search evaluation function that determines if a listing matches a search query
 * utilizing canonical city/state/country mapping and keyword index expansion.
 */
export function matchesLocationSearch(
  listing: {
    title?: string;
    location?: string;
    description?: string;
    city?: string;
    state?: string;
    country?: string;
  },
  searchQuery: string
): boolean {
  if (!searchQuery || !searchQuery.trim()) return true;

  const q = searchQuery.toLowerCase().trim();

  // 1. Standard text fields match
  const locStr = (listing.location || '').toLowerCase();
  const titleStr = (listing.title || '').toLowerCase();
  const descStr = (listing.description || '').toLowerCase();
  const cityStr = (listing.city || '').toLowerCase();
  const stateStr = (listing.state || '').toLowerCase();
  const countryStr = (listing.country || '').toLowerCase();

  if (
    locStr.includes(q) ||
    titleStr.includes(q) ||
    descStr.includes(q) ||
    cityStr.includes(q) ||
    stateStr.includes(q) ||
    countryStr.includes(q)
  ) {
    return true;
  }

  // 2. Resolve search query to canonical location metadata & keywords
  const resolvedQueryMeta = resolveLocationMeta(q);

  if (resolvedQueryMeta.keywords.length > 0) {
    for (const kw of resolvedQueryMeta.keywords) {
      if (kw.length < 3) continue;
      if (
        locStr.includes(kw) ||
        cityStr.includes(kw) ||
        stateStr.includes(kw) ||
        countryStr.includes(kw)
      ) {
        return true;
      }
    }

    if (resolvedQueryMeta.city && (cityStr.includes(resolvedQueryMeta.city.toLowerCase()) || locStr.includes(resolvedQueryMeta.city.toLowerCase()))) {
      return true;
    }
    if (resolvedQueryMeta.state && (stateStr.includes(resolvedQueryMeta.state.toLowerCase()) || locStr.includes(resolvedQueryMeta.state.toLowerCase()))) {
      return true;
    }
  }

  // 3. Reverse check: resolve listing location string to see if query matches listing's resolved keywords
  if (listing.location || listing.city) {
    const listingMeta = resolveLocationMeta(listing.location || listing.city || '');
    if (listingMeta.keywords.length > 0) {
      if (listingMeta.keywords.some(kw => kw.length >= 3 && (q.includes(kw) || kw.includes(q)))) {
        return true;
      }
      if (listingMeta.city && q.includes(listingMeta.city.toLowerCase())) return true;
      if (listingMeta.state && q.includes(listingMeta.state.toLowerCase())) return true;
    }
  }

  return false;
}

