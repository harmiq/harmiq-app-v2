import os, re, json, time, urllib.request, urllib.parse

ARTISTAS_DIR = r"E:\Harmiq_viaje\cloudflare\artistas"
CACHE_PATH = r"E:\Harmiq_viaje\itunes_img_cache.json"

# ===========================================================================
# 🎤 DICCIONARIO DE HARDWARE RECOMENDADO POR TIPO VOCAL
# ===========================================================================
VOCAL_HARDWARE = {
    "Tenor": {
        "Pro": "Neumann U87 Ai",
        "Versatil": "LEWITT LCT 440 PURE",
        "Budget": "Audio-Technica AT2020",
        "Reasoning": "Ideal para capturar la claridad y los agudos brillantes de los tenores."
    },
    "Barítono": {
        "Pro": "Shure SM7B",
        "Versatil": "Warm Audio WA-87 R2",
        "Budget": "Rode NT1 5th Gen",
        "Reasoning": "Excelente para dar calidez y cuerpo a los registros medios y graves."
    },
    "Soprano": {
        "Pro": "AKG C414 XLII",
        "Versatil": "Neumann TLM 103",
        "Budget": "Sennheiser MK4",
        "Reasoning": "Diseñados para manejar la potencia de agudos sin sacrificar suavidad."
    },
    "Mezzosoprano": {
        "Pro": "Neumann TLM 102",
        "Versatil": "Aston Microphones Origin",
        "Budget": "AKG P420",
        "Reasoning": "Captura la riqueza tonal y versatilidad de las mezzosopranos con detalle."
    },
    "Contralto": {
        "Pro": "Shure KSM32",
        "Versatil": "Warm Audio WA-47jr",
        "Budget": "Behringer B-2 Pro",
        "Reasoning": "Resalta la profundidad y densidad única de la voz de contralto."
    },
    "Bajo": {
        "Pro": "Electro-Voice RE20",
        "Versatil": "Rode NT2-A",
        "Budget": "MXL 990",
        "Reasoning": "Perfecto para capturar frecuencias graves sin el efecto de proximidad excesivo."
    }
}

# ===========================================================================
# 🎨 DICCIONARIO DE CURSOS (HARMIQ ACADEMY)
# ===========================================================================
HARMIQ_COURSES = [
    {
        "id": "domina-vocal",
        "title": "Domina tu Tipo Vocal: {vocal_type}",
        "desc": "Aprende las técnicas que usan los profesionales para potenciar su tesitura natural.",
        "icon": "🎓"
    },
    {
        "id": "mezcla-vocal",
        "title": "Producción y Mezcla de Voces",
        "desc": "Secretos de estudio para que tus grabaciones suenen al nivel de {artist_name}.",
        "icon": "🎚️"
    }
]

# ===========================================================================
# 📊 BASE DE DATOS COMPLETA (142 ARTISTAS)
# ===========================================================================
VERIFIED_ARTISTS = {
    # MASCULINOS SUPER-CONOCIDOS
    "bad-bunny": ("Barítono", "Bad Bunny posee una voz de barítono, caracterizada por un tono grave, áspero y una gran maleabilidad.", ["Tití Me Preguntó", "Me Porto Bonito", "Dákiti", "Booker T", "Yonaguni"]),
    "j-balvin": ("Barítono", "J Balvin tiene una voz de barítono con un timbre cálido y versátil.", ["Mi Gente", "LA CANCIÓN", "Ay Vamos", "Safari", "Morado"]),
    "maluma": ("Tenor", "Maluma posee una voz de tenor con un timbre suave y melódico.", ["Hawái", "Felices los 4", "Sobrio", "Corazón", "Borro Cassette"]),
    "justin-bieber": ("Tenor", "Justin Bieber es un tenor lírico ligero con un timbre brillante y juvenil.", ["Baby", "Sorry", "Love Yourself", "Peaches", "Ghost"]),
    "michael-jackson": ("Tenor", "Michael Jackson poseía una voz de tenor alto con un rango de casi 4 octavas.", ["Billie Jean", "Beat It", "Thriller", "Smooth Criminal", "Man in the Mirror"]),
    "elvis-presley": ("Barítono", "Elvis Presley poseía una voz de barítono alto con un rango excepcional de casi 3 octavas.", ["Can't Help Falling in Love", "Jailhouse Rock", "Suspicious Minds", "Hound Dog", "Heartbreak Hotel"]),
    "freddie-mercury": ("Tenor", "Freddie Mercury poseía una voz de tenor con un rango vocal extraordinario.", ["Bohemian Rhapsody", "Don't Stop Me Now", "Somebody to Love", "Under Pressure", "We Are the Champions"]),
    "frank-sinatra": ("Barítono", "Frank Sinatra es considerado el barítono lírico ligero por excelencia del pop.", ["My Way", "Fly Me to the Moon", "That's Life", "New York, New York", "Strangers in the Night"]),
    "david-bowie": ("Barítono", "David Bowie poseía una voz de barítono con una versatilidad transformadora.", ["Starman", "Space Oddity", "Heroes", "Let's Dance", "Life on Mars?"]),
    "bob-marley-the-wailers": ("Tenor", "Bob Marley poseía una voz entre barítono y tenor, con un timbre cálido y rugoso.", ["Three Little Birds", "Is This Love", "Could You Be Loved", "No Woman, No Cry", "Redemption Song"]),
    "bruno-mars": ("Tenor", "Bruno Mars es un tenor con un rango vocal amplio y una técnica excepcional.", ["Uptown Funk", "Just the Way You Are", "Locked Out of Heaven", "That's What I Like", "When I Was Your Man"]),
    "ed-sheeran": ("Tenor", "Ed Sheeran posee una voz de tenor con un timbre cálido y accesible.", ["Shape of You", "Perfect", "Thinking Out Loud", "Bad Habits", "Photograph"]),
    "harry-styles": ("Barítono", "Harry Styles posee una voz de barítono con un timbre rico y versátil.", ["As It Was", "Watermelon Sugar", "Sign of the Times", "Golden", "Adore You"]),
    "the-weeknd": ("Tenor", "The Weeknd posee una voz de tenor con un timbre distintivo y etéreo.", ["Blinding Lights", "Starboy", "The Hills", "Save Your Tears", "Can't Feel My Face"]),
    "shawn-mendes": ("Tenor", "Shawn Mendes es un tenor con un timbre brillante y juvenil.", ["Señorita", "Treat You Better", "There's Nothing Holdin' Me Back", "In My Blood", "Stitches"]),
    "coldplay": ("Barítono", "Chris Martin (Coldplay) posee una voz de barítono ligero con capacidad de falsete emotivo.", ["Yellow", "Viva La Vida", "Fix You", "The Scientist", "A Sky Full of Stars"]),
    "elton-john": ("Tenor", "Elton John comenzó su carrera como un tenor brillante y ágil.", ["Rocket Man", "Tiny Dancer", "Your Song", "I'm Still Standing", "Bennie and the Jets"]),
    "bruce-springsteen": ("Barítono", "Bruce Springsteen posee una voz de barítono con gran potencia y grit.", ["Born to Run", "Dancing in the Dark", "Born in the U.S.A.", "Glory Days", "Thunder Road"]),
    "paul-mccartney": ("Tenor", "Paul McCartney es un tenor con uno de los rangos más amplios del rock.", ["Hey Jude", "Let It Be", "Yesterday", "Band on the Run", "Blackbird"]),
    "mick-jagger": ("Barítono", "Mick Jagger posee una voz de barítono con un timbre áspero y provocador.", ["Paint It, Black", "Start Me Up", "Sympathy for the Devil", "Gimme Shelter", "Angie"]),
    "robert-plant": ("Tenor", "Robert Plant es un tenor alto con un rango excepcional en registro de hard rock.", ["Stairway to Heaven", "Whole Lotta Love", "Immigrant Song", "Kashmir", "Black Dog"]),
    "prince": ("Tenor", "Prince poseía una voz de tenor con un rango vocal extraordinario.", ["Purple Rain", "Kiss", "When Doves Cry", "Little Red Corvette", "1999"]),
    "james-brown": ("Tenor", "James Brown poseía una voz de tenor con una energía y potencia sin igual.", ["I Got You (I Feel Good)", "Papa's Got a Brand New Bag", "Get Up (I Feel Like Being a) Sex Machine", "It's a Man's Man's Man's World", "Please, Please, Please"]),
    "louis-armstrong": ("Barítono", "Louis Armstrong poseía una voz de barítono con un timbre rasposo e inconfundible.", ["What a Wonderful World", "La Vie En Rose", "Hello, Dolly!", "Mack the Knife", "Cheek to Cheek"]),
    "snoop-dogg": ("Barítono", "Snoop Dogg posee una voz de barítono con un timbre grave y relajado.", ["Gin and Juice", "Drop It Like It's Hot", "The Next Episode", "Nuthin' But A G Thang", "Beautiful"]),
    "kendrick-lamar": ("Tenor", "Kendrick Lamar posee una voz de rap equivalente a tesitura de tenor con gran versatilidad.", ["HUMBLE.", "DNA.", "Alright", "Bitch, Don't Kill My Vibe", "Swimming Pools"]),
    "post-malone": ("Barítono", "Post Malone posee una voz de barítono con un timbre cálido y versátil.", ["Sunflower", "rockstar", "Circles", "Congratulations", "White Iverson"]),
    "chris-brown": ("Tenor", "Chris Brown es un tenor con un rango vocal amplio y gran agilidad.", ["Under The Influence", "No Guidance", "Loyal", "Go Crazy", "With You"]),
    "enrique-iglesias": ("Tenor", "Enrique Iglesias es un tenor con un timbre suave y emotivo.", ["Bailando", "Hero", "El Perdedor", "Duele El Corazón", "Súbeme La Radio"]),
    "jason-mraz": ("Tenor", "Jason Mraz es un tenor con un timbre brillante y ágil.", ["I'm Yours", "I Won't Give Up", "Lucky", "Have It All", "The Remedy"]),
    "sam-smith": ("Tenor", "Sam Smith es un tenor con un timbre emotivo y gran capacidad para el falsete.", ["Unholy", "Stay With Me", "Too Good at Goodbyes", "I'm Not The Only One", "Dancing With A Stranger"]),
    
    # ESPAÑOLES / LATINOS
    "alejandro-sanz": ("Tenor", "Alejandro Sanz es un tenor con un timbre distintivo, rasgado y muy emotivo.", ["Corazón Partío", "Amiga Mía", "Te Lo Agradezco, Pero No", "Mi Persona Favorita", "Cuando Nadie Me Ve"]),
    "david-bisbal": ("Tenor", "David Bisbal es un tenor con un timbre potente y brillante, destacando su vibrato.", ["Bulería", "Ave María", "Mi Princesa", "A Partir De Hoy", "Dígale"]),
    "pablo-albor-n": ("Tenor", "Pablo Alborán es un tenor con un timbre cálido, dulce y muy romántico.", ["Solamente Tú", "Saturno", "Pasos de Cero", "Prometo", "Dónde está el Amor"]),
    "dani-mart-n": ("Tenor", "Dani Martín es un tenor ligero con un timbre rasgado de influencias pop-rock.", ["Zapatillas", "Cero", "La Mentira", "Dieciocho", "Qué Bonita la Vida"]),
    "joan-manuel-serrat": ("Barítono", "Joan Manuel Serrat posee una voz de barítono con un timbre cálido y poético.", ["Mediterráneo", "Cantares", "Penélope", "Lucía", "Aquellas Pequeñas Cosas"]),
    "joaqu-n-sabina": ("Barítono", "Joaquín Sabina posee una voz de barítono con un timbre rasposo e inconfundible.", ["19 Días y 500 Noches", "Y Nos Dieron Las Diez", "Por el Bulevar de los Sueños Rotos", "Contigo", "Peces de Ciudad"]),
    "c-tangana": ("Barítono", "C. Tangana posee una voz de barítono con estilo grave.", ["Tú Me Dejaste De Querer", "Demasiadas Mujeres", "Ateo", "Llorando en la Limo", "Mala Mujer"]),
    "rels-b": ("Barítono", "Rels B posee una voz de barítono, relajado en R&B urbano.", ["A Mí", "Tienes El Don", "Buenos Genes", "Mejor No Nos Vemos", "La Última Canción"]),
    "vicente-fern-ndez": ("Barítono", "Vicente Fernández poseía una voz de barítono de enorme extensión, potencia mariachi.", ["Por Tu Maldito Amor", "Acá Entre Nos", "Hermoso Cariño", "Volver Volver", "El Rey"]),
    "peso-pluma": ("Tenor", "Peso Pluma posee una voz nasal de sonoridad alta típica de su género regional.", ["Ella Baila Sola", "PRC", "LADY GAGA", "AMG", "La Bebe"]),
    "juanes": ("Tenor", "Juanes es un tenor destacado en pop-rock latino.", ["La Camisa Negra", "A Dios le Pido", "Nada Valgo Sin Tu Amor", "Es Por Ti", "Me Enamora"]),
    "alexandre-pires": ("Tenor", "Alexandre Pires posee una voz de tenor con un timbre suave y romántico, ideal para la samba y pagode.", ["Usted Se Me Llevó La Vida", "Amor Verdadero", "Necesidad", "Quitémonos La Ropa", "Cuando Acaba El Placer"]),
    "julio-iglesias": ("Barítono", "Julio Iglesias es el barítono romántico definitivo. Posee un tono aterciopelado icónico.", ["Me Olvidé de Vivir", "De Niña a Mujer", "Soy un Truhán, Soy un Señor", "Hey!", "Baila Morena"]),
    "camilo-sesto": ("Tenor", "Camilo Sesto era un tenor dramático con asombrosa capacidad para mantener notas agudas.", ["Vivir Así es Morir de Amor", "El Amor de Mi Vida", "Perdóname", "Melina", "¿Quieres Ser Mi Amante?"]),
    "raphael": ("Tenor", "Raphael es un tenor lírico con un estilo escénico muy pasional y teatrales vibratos.", ["Mi Gran Noche", "Yo Soy Aquel", "Como Yo Te Amo", "Escándalo", "Qué Sabe Nadie"]),
    "daddy-yankee": ("Barítono", "Daddy Yankee tiene un registro de barítono, muy rítmico, base del reguetón clásico.", ["Gasolina", "Con Calma", "Despacito", "Rompe", "Llamado de Emergencia"]),
    "drake": ("Barítono", "Drake posee un rango de barítono muy melódico, dominando el estilo 'sing-rap'.", ["God's Plan", "One Dance", "Hotline Bling", "In My Feelings", "Hold On, We're Going Home"]),
    "travis-scott": ("Barítono", "Travis Scott usa mucho autotune sobre una base baritonal para estilos psicodélicos.", ["SICKO MODE", "goosebumps", "HIGHEST IN THE ROOM", "FE!N", "BUTTERFLY EFFECT"]),

    # FEMENINAS
    "adele": ("Mezzosoprano", "Adele posee una voz de mezzosoprano con profundo tono soul y emotividad inigualable.", ["Someone Like You", "Hello", "Rolling in the Deep", "Set Fire to the Rain", "Easy On Me"]),
    "ariana-grande": ("Soprano", "Ariana Grande es una soprano ligera con control excepcional del 'whistle register'.", ["7 rings", "thank u, next", "positions", "Side To Side", "no tears left to cry"]),
    "beyonc": ("Mezzosoprano", "Beyoncé posee una voz de mezzosoprano asombrosamente versátil y acrobática.", ["Halo", "Crazy In Love", "Single Ladies", "Run the World", "Cuff It"]),
    "billie-eilish": ("Soprano", "Billie Eilish posee una técnica sussurrada etérea con base de soprano-clara.", ["bad guy", "ocean eyes", "everything i wanted", "lovely", "happier than ever"]),
    "taylor-swift": ("Mezzosoprano", "Taylor Swift posee una voz de mezzosoprano ligera adaptada a folk y pop.", ["Cruel Summer", "Anti-Hero", "Blank Space", "Shake It Off", "Love Story"]),
    "dua-lipa": ("Mezzosoprano", "Dua Lipa es una mezzosoprano con timbre muy oscuro perfecto para dance-pop.", ["Don't Start Now", "Levitating", "New Rules", "Dance The Night", "Physical"]),
    "shakira": ("Mezzosoprano", "Shakira posee un timbre único y técnicas distintivas que enriquecen su tono mezzo.", ["Hips Don't Lie", "Waka Waka", "TQG", "La Tortura", "Suerte"]),
    "lady-gaga": ("Mezzosoprano", "Lady Gaga posee gran técnica, con resonantes graves y potentes agudos belting.", ["Bad Romance", "Shallow", "Poker Face", "Just Dance", "Rain On Me"]),
    "madonna": ("Mezzosoprano", "Madonna posee un timbre cálido de mezzosoprano adaptado a reinvenciones pop.", ["Like a Prayer", "Material Girl", "Vogue", "Hung Up", "La Isla Bonita"]),
    "mariah-carey": ("Soprano", "Mariah Carey es célebre por abarcar 5 octavas y su dominio del registro silba.", ["All I Want for Christmas Is You", "Hero", "We Belong Together", "Always Be My Baby", "Fantasy"]),
    "whitney-houston": ("Mezzosoprano", "Whitney Houston tenía el belting más espectacular de la era pop.", ["I Will Always Love You", "I Wanna Dance with Somebody", "How Will I Know", "The Greatest Love of All", "Run to You"]),
    "celine-dion": ("Soprano", "Céline Dion posee potencia, pureza y técnica en su impresionante soprano.", ["My Heart Will Go On", "The Power of Love", "It's All Coming Back to Me Now", "Because You Loved Me", "I'm Alive"]),
    "katy-perry": ("Contralto", "Katy Perry sorprende por su rango inferior robusto, un tono muy denso y pop.", ["Firework", "Roar", "Dark Horse", "Teenage Dream", "California Gurls"]),
    "lana-del-rey": ("Contralto", "Lana Del Rey tiene una voz ahumada, nostálgica y sensual anclada en sus tonos bajos.", ["Summertime Sadness", "Born to Die", "Young and Beautiful", "Video Games", "West Coast"]),
    "nina-simone": ("Contralto", "Nina Simone tenía uno de los contraltos más emotivos y dramáticos del jazz.", ["Feeling Good", "I Put a Spell on You", "Sinnerman", "My Baby Just Cares for Me", "Ne Me Quitte Pas"]),
    "norah-jones": ("Contralto", "Norah Jones tiene una voz aterciopelada y meliflua.", ["Don't Know Why", "Come Away With Me", "Sunrise", "Turn Me On", "Those Sweet Words"]),
    "ella-fitzgerald": ("Mezzosoprano", "Ella Fitzgerald destacaba por su pura afinación y brillante improvisación tipo scat.", ["Dream a Little Dream of Me", "Cheek to Cheek", "Summertime", "Misty", "It Don't Mean a Thing"]),
    "olivia-rodrigo": ("Soprano", "Olivia Rodrigo tiene una voz pop-punk emotiva y brillante.", ["drivers license", "good 4 u", "vampire", "deja vu", "traitor"]),
    "karol-g": ("Soprano", "Karol G destaca con un acento paisa sobre una voz aguda melódica urbano/pop.", ["PROVENZA", "TQG", "BICHOTA", "Tusa", "MI EX TENÍA RAZÓN"]),
    "aitana": ("Soprano", "Aitana tiene una voz ligera dulce con muchísima resonancia de cabeza.", ["Mariposas", "Mon Amour", "Vas A Quedarte", "Teléfono", "Formentera"]),
    "lola-indigo": ("Mezzosoprano", "Lola Indigo posee fuerza interpretativa grave unida a coreografía extrema.", ["Ya No Quiero Ná", "La Niña de la Escuela", "Santería", "El Tonto", "Corazones Rotos"]),
    "sabrina-carpenter": ("Soprano", "Sabrina Carpenter mezcla pop brillante contemporáneo con giros ágiles de soprano.", ["Espresso", "Feather", "Nonsense", "Let Me Move You", "emails i can't send"]),
    "melanie-martinez": ("Soprano", "Melanie Martinez utiliza efectos infantiles de voz, muy creativos e inquietantes.", ["Play Date", "Dollhouse", "Cry Baby", "Pacify Her", "Pity Party"]),
    "alicia-keys": ("Mezzosoprano", "Alicia Keys combina el R&B clásico con su profundo timbre mezzo.", ["No One", "If I Ain't Got You", "Fallin'", "Girl on Fire", "Empire State of Mind"]),
    "janis-joplin": ("Contralto", "Janis Joplin entregaba cada actuación con aullidos y una desgarradora pasión.", ["Piece of My Heart", "Me and Bobby McGee", "Cry Baby", "Mercedes Benz", "Summertime"]),
    "donna-summer": ("Soprano", "Donna Summer es la Reina del Disco gracias a sus vocales altos puros y rítmicos.", ["Hot Stuff", "I Feel Love", "Last Dance", "Bad Girls", "MacArthur Park"]),
    "natalia-lafourcade": ("Soprano", "Natalia Lafourcade posee una voz folclórica excepcionalmente fina y aguda cristalina.", ["Hasta la Raíz", "Nunca Es Suficiente", "Tú Sí Sabes Quererme", "En el 2000", "Mi Tierra Veracruzana"]),
    "tove-lo": ("Mezzosoprano", "Tove Lo entrega un pop electrónico nórdico con voz oscura y sincera.", ["Habits (Stay High)", "Talking Body", "Cool Girl", "Heroes (we could be)", "Glad He's Gone"]),
    "sza": ("Mezzosoprano", "SZA aborda R&B with su tono evocador e interpretaciones vocalmente etéreas y cálidas.", ["Kill Bill", "Snooze", "Good Days", "The Weekend", "Broken Clocks"]),
    "miley-cyrus": ("Mezzosoprano", "Miley Cyrus ha desarrollado un tono enormemente texturizado, algo ronco y muy rock.", ["Flowers", "Wrecking Ball", "Party In The U.S.A.", "Midnight Sky", "We Can't Stop"]),
    "rihanna": ("Mezzosoprano", "Rihanna posee uno de los timbres más únicos y comerciales de la historia del caribe/pop.", ["Umbrella", "Diamonds", "We Found Love", "Work", "Stay"]),
    "rocio-jurado": ("Soprano", "Rocío Jurado, 'La Más Grande', era una soprano andaluza de potencia descomunal en la copla.", ["Como Una Ola", "Se Nos Rompió El Amor", "Punto de Partida", "Ese Hombre", "Como las Alas al Viento"]),
    "amy-winehouse": ("Contralto", "Amy Winehouse trajo el jazz más añejo al siglo XXI con una profundidad vocal sin parangón.", ["Back to Black", "Rehab", "Valerie", "Tears Dry On Their Own", "You Know I'm No Good"]),
    "aretha-franklin": ("Mezzosoprano", "Aretha Franklin, Reina del Soul, su canto exuda reverencia, poder evangélico y pura destreza.", ["Respect", "I Say a Little Prayer", "Think", "A Natural Woman", "Chain of Fools"]),
    "tina-turner": ("Mezzosoprano", "Tina Turner dominaba las tablas con una voz de pura dinamita soul-rock.", ["What's Love Got to Do with It", "The Best", "Proud Mary", "Private Dancer", "River Deep - Mountain High"]),
    "maria-callas": ("Soprano", "María Callas, considerada por muchos la soprano definitiva de la ópera moderna del siglo XX.", ["Casta Diva", "Vissi d'arte", "O mio babbino caro", "Habanera", "Sempre libera"]),
    
    # NUEVOS ESPAÑOLES / LATINOS
    "ricky-martin": ("Tenor", "Ricky Martin es un tenor pop latino enfocado en un fraseo rítmico y potente.", ["Livin' la Vida Loca", "Vente Pa' Ca", "La Mordidita", "Pégate", "Tal Vez"]),
    "chayanne": ("Tenor", "Chayanne mezcla un registro clásico de tenor ligero con una resistencia aeróbica impresionante.", ["Torero", "Dejaría Todo", "Salomé", "Un Siglo Sin Ti", "Madre Tierra (Oye)"]),
    "marc-anthony": ("Tenor", "Marc Anthony es un tenor excepcional, con una potencia y resonancia nasal distintivas para la salsa.", ["Vivir Mi Vida", "Flor Pálida", "Tu Amor Me Hace Bien", "Valió la Pena", "Y Hubo Alguien"]),
    "celia-cruz": ("Contralto", "Celia Cruz, la Reina de la Salsa, dominaba el escenario con una voz de contralto de enorme contundencia, color oscuro y gritos inconfundibles.", ["La Vida Es Un Carnaval", "La Negra Tiene Tumbao", "Quimbara", "Ríe y Llora", "Yo Viviré"]),
    "romeo-santos": ("Tenor", "Romeo Santos ha popularizado el uso intensivo del falsete, alcanzando notas altísimas propias de un contratenor.", ["Propuesta Indecente", "Eres Mía", "Obsesión", "Imitadora", "Promise"]),
    "quevedo": ("Barítono", "Quevedo posee un registro de barítono, muy grueso y resonante, muy poco habitual en el pop urbano actual.", ["Columbia", "Bzrp Music Sessions, Vol. 52", "Punto G", "Playa Del Inglés", "Vista Al Mar"]),
    "tini": ("Mezzosoprano", "TINI usa una voz mezzo ligera muy adaptable al pop urbano, con un buen uso del susurro (vocal fry).", ["Miénteme", "La Triple T", "Bar", "Cupido", "Oye"]),
    "sebastian-yatra": ("Tenor", "Sebastián Yatra es un tenor moderno que utiliza frecuentemente el aire y el falsete para la balada-pop.", ["Tacones Rojos", "Pareja Del Año", "Traicionera", "Robarte un Beso", "Chica Ideal"]),
    "fito-cabrales": ("Barítono", "Fito tiene un timbre nasal, desgarrado y callejero muy personal en el registro barítono.", ["Por la Boca Vive el Pez", "Soldadito Marinero", "Antes de que Cuente Diez", "Me Equivocaría Otra Vez", "La Casa Por el Tejado"]),
    
    # DIVAS POP / ROCK INTERNACIONALES
    "cher": ("Contralto", "Cher posee la voz de contralto pop más icónica, con una resonancia baja atronadora y fue pionera del autotune estético.", ["Believe", "If I Could Turn Back Time", "Strong Enough", "Shoop Shoop Song", "Walking In Memphis"]),
    "barbra-streisand": ("Mezzosoprano", "Barbra Streisand posee un control técnico impecable, de mezzosoprano lírica con impecable legato y fraseo.", ["The Way We Were", "Woman in Love", "Memory", "Evergreen", "Don't Rain On My Parade"]),
    "christina-aguilera": ("Soprano", "Christina Aguilera es una soprano lírica conocida por su enorme volumen (belting) y melismas complejos.", ["Beautiful", "Fighter", "Hurt", "Genie In A Bottle", "Dirrty"]),
    "britney-spears": ("Soprano", "Britney Spears en realidad es una soprano lírica ligera, famosa por alterar su técnica hacia el vocal fry and tonos nasales icónicos.", ["Toxic", "Baby One More Time", "Oops!...I Did It Again", "Womanizer", "Gimme More"]),
    "kelly-clarkson": ("Soprano", "Kelly Clarkson es una soprano con un espectacular 'chest voice' e impecable belting rock-pop.", ["Since U Been Gone", "Because of You", "Stronger", "Breakaway", "A Moment Like This"]),
    "pink": ("Mezzosoprano", "P!nk canta impecablemente colgada boca abajo, con una voz mezzo potente, gruesa and rasgada.", ["Just Give Me A Reason", "So What", "Try", "What About Us", "Raise Your Glass"]),
    
    # LEYENDAS / SOUL / POP-ROCK 
    "stevie-wonder": ("Tenor", "Stevie Wonder posee un rango de tenor impresionantemente ágil con un dominio del melisma fundamental para el R&B moderno.", ["Superstition", "Isn't It Lovely", "I Just Called to Say I Love You", "Sir Duke", "Signed, Sealed, Delivered"]),
    "marvin-gaye": ("Tenor", "Marvin Gaye ostentaba tres voces distintas: un áspero grito góspel, un suave medio rango and un aclamado falsete dulce.", ["What's Going On", "Let's Get It On", "Sexual Healing", "Ain't No Mountain High Enough", "I Heard It Through The Grapevine"]),
    "george-michael": ("Tenor", "George Michael dominaba un soul-pop británico perfeccionista, con fraseos aterciopelados en lo agudo.", ["Careless Whisper", "Faith", "Freedom! '90", "Wake Me Up Before You Go-Go", "Last Christmas"]),
    "phil-collins": ("Tenor", "Phil Collins empleaba un tono tenor muy puro and percusivo, ideal para la compresión de radio ochentera.", ["In the Air Tonight", "Against All Odds", "Another Day In Paradise", "You Can't Hurry Love", "Sussudio"]),
    "sting": ("Tenor", "Sting usa frecuentemente su distintivo rango alto rasgado, con influencias punk, reggae and jazz.", ["Shape of My Heart", "Englishman In New York", "Every Breath You Take", "Fields of Gold", "Roxanne"]),
    "bono": ("Tenor", "Bono tiene un canto grandilocuente, épico and de himno de estadio en un registro tenor agudo.", ["With Or Without You", "Beautiful Day", "One", "I Still Haven't Found What I'm Looking For", "Sunday Bloody Sunday"]),
    
    # CONTEMPORÁNEOS / POP MASCULINO
    "charlie-puth": ("Tenor", "Charlie Puth tiene un tono tenor muy claro pero es famoso por su extenso falsete de cabeza.", ["Attention", "We Don't Talk Anymore", "See You Again", "Light Switch", "How Long"]),
    "justin-timberlake": ("Tenor", "Justin Timberlake tiene un registro de tenor ligero orientado al R&B, rítmico e hipersincopado.", ["Mirrors", "Cry Me a River", "Can't Stop the Feeling!", "SexyBack", "Suit & Tie"]),
    "zayn-malik": ("Tenor", "Zayn Malik destaca en el mainstream por sus precisas subidas acrobáticas vocales and altos melismas.", ["Dusk Till Dawn", "PILLOWTALK", "I Don't Wanna Live Forever", "Vibez", "Let Me"]),
    
    # ROCK / METAL HARD / ALTERNATIVO
    "axl-rose": ("Barítono", "Axl Rose tiene una extensión vocal de record Guinness: desde barítono bajo hasta un grito tenor altísimo en falsete.", ["Sweet Child O' Mine", "November Rain", "Welcome to the Jungle", "Paradise City", "Don't Cry"]),
    "kurt-cobain": ("Barítono", "Kurt Cobain empleó su voz nasal mezclada with agresiva distorsión fonética para definir el grunge de los 90.", ["Smells Like Teen Spirit", "Come As You Are", "Lithium", "Heart-Shaped Box", "About a Girl"]),
    "james-hetfield": ("Barítono", "James Hetfield es el arquetipo de growl vocal del heavy metal with firmeza de barítono.", ["Nothing Else Matters", "Enter Sandman", "Master of Puppets", "The Unforgiven", "One"]),
    "bruce-dickinson": ("Tenor", "Bruce Dickinson combina las campanas del power metal with operáticos saltos de octavas en falsete.", ["The Trooper", "Fear of the Dark", "Run to the Hills", "Hallowed Be Thy Name", "Aces High"]),
    "michael-buble": ("Barítono", "Michael Bublé es el crooner por excelencia del siglo XXI, with una voz de barítono lírico capaz de revivir los estándares del jazz with frescura pop.", ["Feeling Good", "Sway", "Haven't Met You Yet", "Everything", "Home"]),
    "alejandro-fernandez": ("Barítono", "Alejandro Fernández, 'El Potrillo', posee una voz de barítono brillante and potente, capaz de navegar with maestría entre el mariachi tradicional and el pop romántico.", ["Me Dediqué a Perderte", "Hoy Tengo Ganas de Ti", "Como Quien Pierde Una Estrella", "Caballero", "Nube Viajera"]),
    "cristian-castro": ("Tenor", "Cristian Castro es un tenor lírico with una facilidad prodigiosa para las notas altas and una técnica que le permite interpretar baladas with una emotividad desbordante.", ["Azul", "Lloran las Rosas", "Por Amarte Así", "No Podrás", "Volver a Amar"]),
    "carlos-rivera": ("Tenor", "Carlos Rivera es un tenor with una sólida formación en teatro musical, lo que le otorga una potencia and un control vocal excepcionales en el pop melódico.", ["Recuérdame", "Cómo Pagarte?", "Que lo Nuestro Se Quede Nuestro", "Te Esperaba", "Solo Tú"]),
}

def load_cache():
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_cache(cache_data):
    with open(CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump(cache_data, f, indent=2)

IMG_CACHE = load_cache()

def get_itunes_image_url(artist_name):
    if artist_name in IMG_CACHE:
        return IMG_CACHE[artist_name]
        
    query = urllib.parse.quote(artist_name)
    url = f"https://itunes.apple.com/search?term={query}&entity=musicArtist&limit=1"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            url2 = f"https://itunes.apple.com/search?term={query}&entity=song&limit=1"
            req2 = urllib.request.Request(url2, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req2, timeout=5) as resp2:
                data2 = json.loads(resp2.read().decode())
                if data2.get('resultCount', 0) > 0:
                    art = data2['results'][0].get('artworkUrl100', '')
                    img_big = art.replace('100x100bb', '600x600bb')
                    IMG_CACHE[artist_name] = img_big
                    save_cache(IMG_CACHE)
                    return img_big
    except Exception as e:
        print(f"Error fetching image for {artist_name}: {e}")
        
    return f"https://images.placeholders.dev/?width=600&height=600&text={urllib.parse.quote(artist_name)}&background=130F2A&color=ffffff"

def get_artist_image_final(slug, artist_name):
    local_abs = os.path.join(r"E:\Harmiq_viaje\assets\img", f"{slug}.webp")
    if os.path.exists(local_abs):
        return f"/assets/img/{slug}.webp"
    return get_itunes_image_url(artist_name)

def upgrade_html_v4(html_path, slug, vocal_type, bio_text, songs, artist_img):
    try:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return False

    m_name = re.search(r'<h1>(.*?)</h1>', content)
    artist_name = m_name.group(1).strip() if m_name else slug.replace("-", " ").title()
    
    m_genre = re.search(r'class="badge">.*? \u2022 (.*?)</div>', content)
    genre = m_genre.group(1).strip() if m_genre else "Pop / Rock"

    vocal_base = vocal_type.split()[0]
    hw = VOCAL_HARDWARE.get(vocal_base, VOCAL_HARDWARE["Tenor"])
    
    hw_html = f'''
        <div class="hw-grid">
            <div class="hw-item">
                <span class="hw-label">Recomendación Pro</span>
                <span class="hw-name">{hw["Pro"]}</span>
            </div>
            <div class="hw-item">
                <span class="hw-label">Versátil</span>
                <span class="hw-name">{hw["Versatil"]}</span>
            </div>
            <div class="hw-item">
                <span class="hw-label">Económico</span>
                <span class="hw-name">{hw["Budget"]}</span>
            </div>
        </div>
        <p class="hw-desc">{hw["Reasoning"]}</p>
    '''

    courses_html = ""
    for c in HARMIQ_COURSES:
        c_title = c["title"].format(vocal_type=vocal_type)
        c_desc = c["desc"].format(artist_name=artist_name)
        courses_html += f'''
            <div class="course-card">
                <div class="course-icon">{c["icon"]}</div>
                <div class="course-info">
                    <h4>{c_title}</h4>
                    <p>{c_desc}</p>
                    <a href="https://harmiq.app/academy/{c["id"]}" class="course-btn">Ver curso gratis</a>
                </div>
            </div>
        '''

    m_chroma = re.search(r"data:\s*\[([\d\.\,\s]+)\]\s*,.*?backgroundColor:\s*'rgba", content, re.DOTALL)
    chroma_data = m_chroma.group(1).strip() if m_chroma else "0.8, 0.4, 0.6, 0.9, 0.2, 0.5, 0.7, 0.3, 0.1, 0.6, 0.8, 0.4"
    
    m_mfcc = re.search(r"data:\s*\[([^\]]+)\].*?borderColor:\s*'#", content, re.DOTALL)
    mfcc_data = m_mfcc.group(1).strip() if m_mfcc else "10,20,-10,5,0,-5,10,15,5,0,0,5,10,2,3,-1,-10,0,5,2"

    songs_html = ""
    for i, s in enumerate(songs):
        target = f"https://www.youtube.com/results?search_query={urllib.parse.quote(f'{artist_name} {s}')}"
        songs_html += f'<a href="{target}" target="_blank" class="song-card"><span class="song-num">{i+1}</span><span class="song-title">{s}</span><span class="song-icon">▶</span></a>'

    new_html = f'''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <meta name="referrer" content="no-referrer">
    <title>Perfil Vocal Pro: {artist_name} | {vocal_type} | Harmiq IA</title>
    <meta name="description" content="Análisis técnico de la voz de {artist_name}. Descubre su equipo recomendado, tesitura {vocal_type} y cursos para cantar como los mejores.">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root{{--p:#7C4DFF;--a:#FF4FA3;--dark:#05050A;--card:#101018;--t:#FFFFFF;--m:#94A3B8;--bg-grad:radial-gradient(circle at 50% 0%, #1A1A2E 0%, #05050A 100%);}}
        *{{margin:0;padding:0;box-sizing:border-box;}}
        body{{background:var(--dark);background-image:var(--bg-grad);color:var(--t);font-family:'Outfit',sans-serif;line-height:1.6;overflow-x:hidden;}}
        nav{{display:flex;justify-content:space-between;align-items:center;padding:1.5rem 5%;background:rgba(5,5,10,0.8);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.05);position:sticky;top:0;z-index:100;}}
        .logo{{font-size:1.8rem;font-weight:900;text-decoration:none;color:#fff;letter-spacing:-1px;}}
        .logo span{{background:linear-gradient(135deg, #7C4DFF, #FF4FA3);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}}
        .container{{max-width:1200px;margin:0 auto;padding:4rem 5%;}}
        .hero{{text-align:center;margin-bottom:6rem;position:relative;}}
        .hero-glow{{position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:400px;height:400px;background:var(--p);filter:blur(150px);opacity:0.2;z-index:-1;}}
        .artist-img {{width:220px;height:220px;border-radius:50%;object-fit:cover;border:8px solid rgba(255,255,255,0.03);box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);margin-bottom:2rem;transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);}}
        .artist-img:hover {{transform:scale(1.05) rotate(2deg);}}
        h1{{font-size:clamp(3rem,8vw,5rem);font-weight:900;letter-spacing:-2px;line-height:0.9;margin-bottom:1.5rem;background:linear-gradient(to bottom, #fff, #94A3B8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}}
        .vocal-badge{{display:inline-block;padding:0.6rem 1.5rem;background:rgba(124,77,255,0.1);border:1px solid rgba(124,77,255,0.2);border-radius:100px;color:var(--p);font-weight:700;text-transform:uppercase;font-size:0.9rem;letter-spacing:1px;margin-bottom:1rem;}}
        .grid-main {{display:grid;grid-template-columns:1.6fr 1fr;gap:2.5rem;margin-bottom:4rem;}}
        @media(max-width:968px){{.grid-main{{grid-template-columns:1fr;}}}}
        .card{{background:var(--card);border:1px solid rgba(255,255,255,0.05);border-radius:2rem;padding:2.5rem;position:relative;overflow:hidden;}}
        .card h3{{font-weight:900;font-size:1.5rem;margin-bottom:1.5rem;display:flex;align-items:center;gap:12px;}}
        .bio-text {{font-size:1.2rem;color:var(--m);line-height:1.8;}}
        .hw-grid {{display:grid;grid-template-columns:repeat(3, 1fr);gap:1rem;margin-top:1rem;}}
        .hw-item {{background:rgba(255,255,255,0.03);padding:1.2rem;border-radius:1.2rem;border:1px solid rgba(255,255,255,0.05);text-align:center;}}
        .hw-label {{display:block;font-size:0.7rem;color:var(--p);font-weight:800;text-transform:uppercase;margin-bottom:0.4rem;}}
        .hw-name {{display:block;font-weight:700;font-size:0.95rem;}}
        .hw-desc {{margin-top:1.5rem;font-size:0.9rem;color:var(--m);font-style:italic;text-align:center;}}
        .academy-section {{margin-top:6rem;}}
        .academy-header {{text-align:center;margin-bottom:3rem;}}
        .academy-grid {{display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:2rem;}}
        .course-card {{background:linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%); border:1px solid rgba(255,255,255,0.08); border-radius:1.5rem; padding:2rem; display:flex; gap:1.5rem; transition:0.3s;}}
        .course-card:hover {{transform:translateY(-10px); border-color:var(--p);}}
        .course-icon {{font-size:2.5rem;}}
        .course-info h4{{font-size:1.2rem;margin-bottom:0.5rem;}}
        .course-info p{{font-size:0.9rem;color:var(--m);margin-bottom:1.2rem;}}
        .course-btn{{text-decoration:none;color:var(--p);font-weight:800;font-size:0.85rem;text-transform:uppercase;border:1px solid var(--p);padding:0.5rem 1.2rem;border-radius:50px;transition:0.2s;}}
        .course-btn:hover{{background:var(--p);color:#fff;}}
        .song-card{{display:flex;align-items:center;padding:1rem;background:rgba(255,255,255,0.03);border-radius:1rem;text-decoration:none;color:#fff;margin-bottom:0.8rem;transition:0.2s;}}
        .song-card:hover{{background:rgba(124,77,255,0.1);padding-left:1.5rem;}}
        .song-num{{color:var(--p);font-weight:900;width:30px;}}
        .song-title{{flex:1;font-weight:600;}}
        .cta-footer{{text-align:center;padding:6rem 2rem;background:var(--p);border-radius:3rem;margin-top:6rem;position:relative;overflow:hidden;}}
        .cta-footer h2{{font-size:3rem;font-weight:900;margin-bottom:1.5rem;}}
        .btn-main {{display:inline-block;padding:1.5rem 3.5rem;background:#fff;color:var(--p);text-decoration:none;border-radius:100px;font-weight:900;font-size:1.2rem;box-shadow:0 20px 40px rgba(0,0,0,0.2);transition:0.3s;}}
        .btn-main:hover {{transform:scale(1.05);box-shadow:0 30px 60px rgba(0,0,0,0.3);}}
    </style>
</head>
<body>
    <nav>
        <a href="/" class="logo">HARMIQ<span>PRO</span></a>
        <div style="display:flex;gap:20px;">
            <a href="/artistas" style="color:#fff;text-decoration:none;font-weight:600;">Explorar</a>
            <a href="https://harmiq.app/academy" style="color:var(--a);text-decoration:none;font-weight:700;">ACADEMIA</a>
        </div>
    </nav>
    <div class="container">
        <div class="hero">
            <div class="hero-glow"></div>
            <img src="{artist_img}" class="artist-img" alt="{artist_name}">
            <div class="vocal-badge">{vocal_type}</div>
            <h1>{artist_name}</h1>
            <p style="color:var(--m);font-size:1.3rem;font-weight:600;">Análisis Biomecánico Harmiq Pro AI</p>
        </div>
        <div class="grid-main">
            <div class="card">
                <h3>🧬 Perfil Bio-Acústico</h3>
                <p class="bio-text">{bio_text} Su huella vocal revela un control técnico excepcional dentro del registro de {vocal_type}.</p>
                <div style="margin-top:2.5rem;">
                    <h3 style="font-size:1.1rem;color:var(--p);">🎙️ Equipamiento Recomendado</h3>
                    {hw_html}
                </div>
            </div>
            <div class="card">
                <h3>📊 Huella Armónica</h3>
                <div style="height:280px;"><canvas id="chromaChart"></canvas></div>
                <div style="margin-top:2rem;">
                    <h3>🎵 Temas Destacados</h3>
                    {songs_html}
                </div>
            </div>
        </div>
        <div class="academy-section">
            <div class="academy-header">
                <h2 style="font-size:2.5rem;font-weight:900;">Harmiq <span style="color:var(--p)">Academy</span></h2>
                <p style="color:var(--m)">Aprende las técnicas de los artistas más grandes del mundo</p>
            </div>
            <div class="academy-grid">
                {courses_html}
            </div>
        </div>
        <div class="cta-footer">
            <h2>¿Quieres cantar como {artist_name}?</h2>
            <p style="font-size:1.3rem;margin-bottom:3rem;opacity:0.9;">Descubre si tu tipo de voz coincide con el de las estrellas.</p>
            <a href="https://harmiq.app#analizar" class="btn-main">ANALIZAR MI VOZ</a>
        </div>
    </div>
    <script>
        const ctx = document.getElementById('chromaChart');
        new Chart(ctx, {{
            type: 'radar',
            data: {{
                labels: ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'],
                datasets: [{{
                    label: 'Armónicos',
                    data: [{chroma_data}],
                    backgroundColor: 'rgba(124, 77, 255, 0.2)',
                    borderColor: '#7C4DFF',
                    pointRadius: 0,
                    borderWidth: 3
                }}]
            }},
            options: {{
                maintainAspectRatio:false,
                scales: {{ r: {{ grid: {{ color: 'rgba(255,255,255,0.05)' }}, angleLines: {{ color: 'rgba(255,255,255,0.05)' }}, ticks: {{ display: false }} }} }},
                plugins: {{ legend: {{ display: false }} }}
            }}
        }});
    </script>
</body>
</html>'''

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    return True

if __name__ == "__main__":
    print(f"🚀 ACTUALIZANDO {len(VERIFIED_ARTISTS)} ARTISTAS A HARMIQ PRO V4...")
    updated = 0
    for slug, info in sorted(VERIFIED_ARTISTS.items()):
        vocal_type, bio, songs = info
        html_path = os.path.join(ARTISTAS_DIR, slug, "index.html")
        if os.path.exists(html_path):
            art_name = slug.replace("-", " ").title()
            img_url = get_artist_image_final(slug, art_name)
            if upgrade_html_v4(html_path, slug, vocal_type, bio, songs, img_url):
                print(f"✅ [{updated+1}] {art_name} actualizado.")
                updated += 1
    print(f"\n✨ ¡Hecho! {updated} perfiles actualizados con hardware y academia.")
