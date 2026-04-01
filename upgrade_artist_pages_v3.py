import os, re, json, time, urllib.request, urllib.parse

ARTISTAS_DIR = r"E:\Harmiq_viaje\cloudflare\artistas"
CACHE_PATH = r"E:\Harmiq_viaje\itunes_img_cache.json"

# ===========================================================================
# BASE DE DATOS VERIFICADA: slug -> (tipo_vocal, bio_tecnica, [top_5_songs])
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
    "sza": ("Mezzosoprano", "SZA aborda R&B con su tono evocador e interpretaciones vocalmente etéreas y cálidas.", ["Kill Bill", "Snooze", "Good Days", "The Weekend", "Broken Clocks"]),
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
    "britney-spears": ("Soprano", "Britney Spears en realidad es una soprano lírica ligera, famosa por alterar su técnica hacia el vocal fry y tonos nasales icónicos.", ["Toxic", "Baby One More Time", "Oops!...I Did It Again", "Womanizer", "Gimme More"]),
    "kelly-clarkson": ("Soprano", "Kelly Clarkson es una soprano con un espectacular 'chest voice' e impecable belting rock-pop.", ["Since U Been Gone", "Because of You", "Stronger", "Breakaway", "A Moment Like This"]),
    "pink": ("Mezzosoprano", "P!nk canta impecablemente colgada boca abajo, con una voz mezzo potente, gruesa y rasgada.", ["Just Give Me A Reason", "So What", "Try", "What About Us", "Raise Your Glass"]),
    
    # LEYENDAS / SOUL / POP-ROCK 
    "stevie-wonder": ("Tenor", "Stevie Wonder posee un rango de tenor impresionantemente ágil con un dominio del melisma fundamental para el R&B moderno.", ["Superstition", "Isn't She Lovely", "I Just Called to Say I Love You", "Sir Duke", "Signed, Sealed, Delivered"]),
    "marvin-gaye": ("Tenor", "Marvin Gaye ostentaba tres voces distintas: un áspero grito góspel, un suave medio rango y un aclamado falsete dulce.", ["What's Going On", "Let's Get It On", "Sexual Healing", "Ain't No Mountain High Enough", "I Heard It Through The Grapevine"]),
    "george-michael": ("Tenor", "George Michael dominaba un soul-pop británico perfeccionista, con fraseos aterciopelados en lo agudo.", ["Careless Whisper", "Faith", "Freedom! '90", "Wake Me Up Before You Go-Go", "Last Christmas"]),
    "phil-collins": ("Tenor", "Phil Collins empleaba un tono tenor muy puro y percusivo, ideal para la compresión de radio ochentera.", ["In the Air Tonight", "Against All Odds", "Another Day In Paradise", "You Can't Hurry Love", "Sussudio"]),
    "sting": ("Tenor", "Sting usa frecuentemente su distintivo rango alto rasgado, con influencias punk, reggae y jazz.", ["Shape of My Heart", "Englishman In New York", "Every Breath You Take", "Fields of Gold", "Roxanne"]),
    "bono": ("Tenor", "Bono tiene un canto grandilocuente, épico y de himno de estadio en un registro tenor agudo.", ["With Or Without You", "Beautiful Day", "One", "I Still Haven't Found What I'm Looking For", "Sunday Bloody Sunday"]),
    
    # CONTEMPORÁNEOS / POP MASCULINO
    "charlie-puth": ("Tenor", "Charlie Puth tiene un tono tenor muy claro pero es famoso por su extenso falsete de cabeza.", ["Attention", "We Don't Talk Anymore", "See You Again", "Light Switch", "How Long"]),
    "justin-timberlake": ("Tenor", "Justin Timberlake tiene un registro de tenor ligero orientado al R&B, rítmico e hipersincopado.", ["Mirrors", "Cry Me a River", "Can't Stop the Feeling!", "SexyBack", "Suit & Tie"]),
    "zayn-malik": ("Tenor", "Zayn Malik destaca en el mainstream por sus precisas subidas acrobáticas vocales y altos melismas.", ["Dusk Till Dawn", "PILLOWTALK", "I Don't Wanna Live Forever", "Vibez", "Let Me"]),
    
    # ROCK / METAL HARD / ALTERNATIVO
    "axl-rose": ("Barítono", "Axl Rose tiene una extensión vocal de record Guinness: desde barítono bajo hasta un grito tenor altísimo en falsete.", ["Sweet Child O' Mine", "November Rain", "Welcome to the Jungle", "Paradise City", "Don't Cry"]),
    "kurt-cobain": ("Barítono", "Kurt Cobain empleó su voz nasal mezclada con agresiva distorsión fonética para definir el grunge de los 90.", ["Smells Like Teen Spirit", "Come As You Are", "Lithium", "Heart-Shaped Box", "About a Girl"]),
    "james-hetfield": ("Barítono", "James Hetfield es el arquetipo de growl vocal del heavy metal con firmeza de barítono.", ["Nothing Else Matters", "Enter Sandman", "Master of Puppets", "The Unforgiven", "One"]),
    "bruce-dickinson": ("Tenor", "Bruce Dickinson combina las campanas del power metal con operáticos saltos de octavas en falsete.", ["The Trooper", "Fear of the Dark", "Run to the Hills", "Hallowed Be Thy Name", "Aces High"]),
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
            if data.get('resultCount', 0) > 0:
                img_url = data['results'][0].get('artistLinkUrl', '')
                # API doesn't guarantee artist high-res imageUrl reliably via musicArtist endpoint 
                # Let's search by song instead to reliably get album arts
                url2 = f"https://itunes.apple.com/search?term={query}&entity=song&limit=1"
                req2 = urllib.request.Request(url2, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req2, timeout=5) as resp2:
                    data2 = json.loads(resp2.read().decode())
                    if data2.get('resultCount', 0) > 0:
                        art = data2['results'][0].get('artworkUrl100', '')
                        img_big = art.replace('100x100bb', '600x600bb')
                        IMG_CACHE[artist_name] = img_big
                        save_cache(IMG_CACHE)
                        time.sleep(0.5)
                        return img_big
    except Exception as e:
        print(f"Error fetching image for {artist_name}: {e}")
        pass
        
    # fallback to initials svg placeholder
    colors = ['#7C4DFF','#FF4FA3','#118AB2','#FF9F1C','#06D6A0','#E63946']
    color = colors[len(artist_name) % len(colors)]
    init = artist_name[:2].upper()
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="{color}"/><text x="300" y="380" font-family="Arial" font-weight="bold" font-size="280" fill="white" text-anchor="middle">{init}</text></svg>'''
    encoded_svg = f"data:image/svg+xml,{urllib.parse.quote(svg)}"
    
    IMG_CACHE[artist_name] = encoded_svg
    save_cache(IMG_CACHE)
    time.sleep(0.5)
    return encoded_svg


def upgrade_html(html_path, slug, vocal_type, bio_text, songs, artist_img):
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Recuperar info original que necesitamos
    m_name = re.search(r'<h1>(.*?)</h1>', content)
    if not m_name:
        return False, "H1 no encontrado"
    artist_name = m_name.group(1).strip()
    
    m_genre = re.search(r'class="badge">.*? \u2022 (.*?)</div>', content)
    genre = "Pop/Rock"
    if m_genre:
        genre = m_genre.group(1).strip()
        
    m_amazon = re.search(r'<a href="(https://www\.amazon\.[^"]+)"[^>]+class="btn btn-amazon"', content)
    amazon_link = m_amazon.group(1) if m_amazon else f"https://www.amazon.es/s?k={slug.replace('-', '+')}+music+cd&tag=harmiqapp-20"
    
    # 2. Rescatar graficos
    m_chroma = re.search(r"data:\s*\[([\d\.\,\s]+)\]\s*,.*?backgroundColor:\s*'rgba", content, re.DOTALL)
    chroma_data = m_chroma.group(1).strip() if m_chroma else "0,0,0,0,0,0,0,0,0,0,0,0"
    
    m_mfcc = re.search(r"data:\s*\[([^\]]+)\].*?borderColor:\s*'#", content, re.DOTALL)
    mfcc_data = m_mfcc.group(1).strip() if m_mfcc else "0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0"

    m_perc = re.findall(r'style="width:(\d+)%', content)
    rms_p = m_perc[0] if len(m_perc) > 0 else "70"
    roll_p = m_perc[1] if len(m_perc) > 1 else "75"
    cent_p = m_perc[2] if len(m_perc) > 2 else "80"

    # Construir lista HTML de canciones
    songs_html = ""
    for idx, song in enumerate(songs):
        delay = idx * 0.1
        yts_link = f"https://www.youtube.com/results?search_query={urllib.parse.quote(f'{artist_name} {song}')}"
        songs_html += f'''
                    <a href="{yts_link}" target="_blank" class="song-card" style="animation-delay:{delay}s">
                        <span class="song-num">{idx+1}</span>
                        <span class="song-title">{song}</span>
                        <span class="song-icon">▶</span>
                    </a>'''

    # NUEVO TEMPLATE HTML CON FOTO Y CANCIONES
    new_html = f'''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>Análisis Vocal de {artist_name} | {vocal_type} | Harmiq IA</title>
    <meta name="description" content="Descubre el perfil vocal y afinación biomecánica de {artist_name}, {vocal_type}. Escucha sus top canciones y análisis de Harmiq.">
    <link rel="canonical" href="https://harmiq.app/artistas/{slug}/">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root{{--p:#7C4DFF;--a:#FF4FA3;--dark:#0A0818;--card:#130F2A;--t:#E5E7EB;--m:#6B7280;}}
        *{{margin:0;padding:0;box-sizing:border-box;}}
        body{{background:var(--dark);color:var(--t);font-family:'Outfit',sans-serif;line-height:1.6;}}
        nav{{display:flex;justify-content:space-between;align-items:center;padding:1rem 4%;background:rgba(10,8,24,.95);border-bottom:1px solid rgba(255,255,255,.07);position:sticky;top:0;z-index:100;}}
        .logo{{font-size:1.7rem;font-weight:900;background:linear-gradient(135deg,#7C4DFF,#FF4FA3);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-decoration:none;}}
        .container{{max-width:1100px;margin:0 auto;padding:3rem 5%;}}
        
        /* NEW HERO REDESIGN */
        .hero {{text-align:center;margin-bottom:4rem;display:flex;flex-direction:column;align-items:center;position:relative;}}
        .hero::before {{content:'';position:absolute;width:250px;height:250px;background:var(--p);filter:blur(100px);opacity:0.3;border-radius:50%;z-index:-1;top:-20px;}}
        
        .artist-avatar {{
            width:180px;height:180px;border-radius:50%;object-fit:cover;
            border:4px solid rgba(255,255,255,0.1);
            box-shadow:0 15px 35px rgba(0,0,0,0.5), 0 0 20px rgba(124,77,255,0.4);
            margin-bottom:1.5rem;
            animation: float 6s ease-in-out infinite;
        }}
        @keyframes float {{ 0%{{transform:translateY(0px)}} 50%{{transform:translateY(-10px)}} 100%{{transform:translateY(0px)}} }}
        
        h1{{font-size:clamp(2.5rem,6vw,4rem);margin-bottom:1rem;line-height:1;font-weight:900;letter-spacing:-1px;}}
        .badge{{background:rgba(124,77,255,.15);color:var(--a);padding:0.5rem 1rem;border-radius:20px;font-weight:700;display:inline-block;margin-bottom:1rem;border:1px solid rgba(124,77,255,.3);text-transform:uppercase;letter-spacing:1px;font-size:0.85rem;}}
        .verified-badge {{display:inline-flex;align-items:center;gap:5px;background:rgba(6,214,160,0.15);color:#06D6A0;padding:6px 12px;border-radius:20px;font-size:0.75rem;font-weight:800;text-transform:uppercase;margin-bottom:1rem;border:1px solid rgba(6,214,160,0.3);}}
        
        /* DATA DASHBOARD */
        .dashboard{{display:grid;grid-template-columns:1.5fr 1fr;gap:2rem;margin-bottom:2rem;}}
        @media(max-width:768px){{ .dashboard{{grid-template-columns:1fr;}} }}
        .card{{background:rgba(255,255,255,0.03);padding:1.8rem;border-radius:1.5rem;border:1px solid rgba(255,255,255,.08);height:100%;backdrop-filter:blur(10px);}}
        
        .technical-bio {{margin-bottom:2rem; padding:2rem; background:linear-gradient(135deg, rgba(255,255,255,0.03), rgba(124,77,255,0.05)); border-radius:1.5rem; border:1px solid rgba(124,77,255,0.15);position:relative;overflow:hidden;}}
        .technical-bio::before {{content:'\\201C';position:absolute;font-size:10rem;color:rgba(255,255,255,0.03);top:-40px;left:-10px;font-family:serif;}}
        .bio-text {{font-size:1.1rem; color:#D1D5DB; line-height:1.7;position:relative;z-index:2;}}

        /* TOP SONGS WIDGET */
        .songs-grid {{display:grid;gap:0.8rem;margin-top:1rem;}}
        .song-card {{display:flex;align-items:center;background:rgba(255,255,255,0.04);padding:0.8rem 1.2rem;border-radius:12px;border:1px solid rgba(255,255,255,0.05);text-decoration:none;color:white;transition:all 0.2s;animation:slideIn 0.5s ease-out backwards;}}
        .song-card:hover {{background:rgba(255,79,163,0.1);border-color:rgba(255,79,163,0.3);transform:translateX(5px);}}
        @keyframes slideIn {{ from{{opacity:0;transform:translateX(-20px)}} to{{opacity:1;transform:translateX(0)}} }}
        .song-num {{color:var(--a);font-weight:800;width:30px;font-size:1.2rem;opacity:0.7;}}
        .song-title {{flex-grow:1;font-weight:600;font-size:1.05rem;}}
        .song-icon {{color:#A5B4FC;font-size:0.8rem;opacity:0.5;}}

        .metric-wrap {{margin-bottom:1.2rem;}}
        .metric-head {{display:flex;justify-content:space-between;font-weight:700;margin-bottom:0.4rem;font-size:0.85rem;color:#A5B4FC;}}
        .progress-bg {{background:rgba(255,255,255,0.08);border-radius:10px;height:12px;overflow:hidden;}}
        .progress-fill {{height:100%;border-radius:10px;transition:width 1s ease-in-out;}}

        .cta-box{{text-align:center;margin-top:4rem;padding:4rem 2rem;background:linear-gradient(135deg,rgba(124,77,255,0.1),rgba(255,79,163,0.1));border-radius:2rem;border:1px solid rgba(124,77,255,0.3);position:relative;}}
        .cta-box::after {{content:''; position:absolute; inset:0; border-radius:2rem; background:radial-gradient(circle at center, rgba(124,77,255,0.2), transparent 70%); z-index:-1;}}
        .btn{{display:inline-flex;align-items:center;justify-content:center;padding:1.2rem 2.8rem;background:linear-gradient(135deg,#7C4DFF,#FF4FA3);color:#fff;text-decoration:none;border-radius:50px;font-weight:900;font-size:1.2rem;box-shadow:0 15px 40px rgba(124,77,255,0.4);transition:all 0.3s;margin-bottom:1.2rem;width:100%;max-width:420px;}}
        .btn:hover{{transform:translateY(-5px) scale(1.02);box-shadow:0 20px 50px rgba(124,77,255,0.6);}}
        .btn-amazon{{background:rgba(255,255,255,0.05);color:var(--t);box-shadow:none;border:1px solid rgba(255,255,255,0.15);font-size:0.95rem;}}
    </style>
</head>
<body>
    <nav>
        <a href="/" class="logo">Harmiq</a>
        <a href="/" style="color:#fff;text-decoration:none;font-weight:800;background:linear-gradient(90deg,#7C4DFF,#FF4FA3);padding:0.5rem 1rem;border-radius:30px;font-size:0.85rem;transition:transform 0.2s;">IA Gratis</a>
    </nav>
    <div class="container">
        <div class="hero">
            <img src="{artist_img}" alt="{artist_name}" class="artist-avatar" loading="lazy">
            <div class="verified-badge">✓ Análisis Verificado por IA</div>
            <div class="badge">{vocal_type} • {genre}</div>
            <h1>{artist_name}</h1>
            <p style="color:var(--m);font-size:1.1rem;max-width:600px;">Análisis biomecánico y acústico de la voz e interpretación.</p>
        </div>

        <div class="technical-bio">
            <h3 style="margin-bottom:1rem; color:var(--a); font-size:1.3rem; font-family:'Baloo 2',sans-serif;display:flex;align-items:center;gap:10px;">
                🧬 Perfil Técnico Vocal
            </h3>
            <p class="bio-text">{bio_text} Su perfil acústico en Harmiq revela una huella vocal distintiva en el espectro musical, adaptada perfectamente a su repertorio iconico.</p>
        </div>

        <div class="dashboard">
            <div class="card" style="height:350px;">
                <h3 style="margin-bottom:1.5rem; color:#fff; font-size:1.2rem;display:flex;align-items:center;gap:8px;">🎧 Métricas clave</h3>
                <div class="metric-wrap">
                    <div class="metric-head"><span>Potencia Base (RMS)</span><span>{rms_p}%</span></div>
                    <div class="progress-bg"><div class="progress-fill" style="width:{rms_p}%;background:linear-gradient(90deg,#F59E0B,#EF4444);"></div></div>
                </div>
                <div class="metric-wrap">
                    <div class="metric-head"><span>Brillo Vocal (Rolloff)</span><span>{roll_p}%</span></div>
                    <div class="progress-bg"><div class="progress-fill" style="width:{roll_p}%;background:linear-gradient(90deg,#3B82F6,#8B5CF6);"></div></div>
                </div>
                <div class="metric-wrap">
                    <div class="metric-head"><span>Centroide Resonante</span><span>{cent_p}%</span></div>
                    <div class="progress-bg"><div class="progress-fill" style="width:{cent_p}%;background:linear-gradient(90deg,#10B981,#3B82F6);"></div></div>
                </div>
                <p style="font-size:0.8rem;color:#6B7280;margin-top:1.5rem;text-align:center;">Estimación de la huella acústica sobre la onda base.</p>
            </div>
            
            <div class="card" style="height:350px; display:flex; flex-direction:column;">
                <h3 style="margin-bottom:1rem; color:#fff; font-size:1.2rem;display:flex;align-items:center;gap:8px;">🎵 Temas Esenciales</h3>
                <div class="songs-grid">
                    {songs_html}
                </div>
            </div>
        </div>

        <div class="dashboard">
            <div class="card" style="height:320px; padding:1.5rem;">
                <h3 style="margin-bottom:0.8rem; font-size:1.1rem;text-align:center;color:#A5B4FC;">Mapa Armónico (Chroma)</h3>
                <div style="height:230px"><canvas id="chromaChart"></canvas></div>
            </div>
            <div class="card" style="height:320px; padding:1.5rem;">
                <h3 style="margin-bottom:0.8rem; font-size:1.1rem;text-align:center;color:#A5B4FC;">Análisis de Timbre (MFCC)</h3>
                <div style="height:230px"><canvas id="mfccChart"></canvas></div>
            </div>
        </div>

        <div class="cta-box">
            <h2 style="font-size:2.8rem; margin-bottom:1rem; font-weight:900;line-height:1.2;">🎤 ¿Tu voz es como la de {artist_name}?</h2>
            <p style="margin-bottom:3rem; font-size:1.25rem; color:#A5B4FC;max-width:700px;margin-left:auto;margin-right:auto;">Usa la Inteligencia Artificial de Harmiq para compararte en tiempo real con más de 12.000 voces de la industria musical.</p>
            <a href="https://harmiq.app/?compare={slug}#app" class="btn">🚀 Iniciar Comparación de Voz</a>
            <br><br>
            <a href="{amazon_link}" target="_blank" rel="nofollow noopener" class="btn btn-amazon">🛒 Equipamiento recomendado para {vocal_type}</a>
        </div>
    </div>

    <script>
        new Chart(document.getElementById('chromaChart'), {{
            type: 'radar',
            data: {{
                labels: ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'],
                datasets: [{{
                    label: 'Armónicos',
                    data: [{chroma_data}],
                    backgroundColor: 'rgba(255, 79, 163, 0.25)',
                    borderColor: '#FF4FA3',
                    pointRadius: 0,
                    borderWidth: 2
                }}]
            }},
            options: {{ maintainAspectRatio:false, scales:{{ r:{{ ticks:{{display:false}}, grid:{{color:'rgba(255,255,255,0.08)'}}, angleLines:{{color:'rgba(255,255,255,0.08)'}} }} }} }}
        }});

        new Chart(document.getElementById('mfccChart'), {{
            type: 'line',
            data: {{
                labels: Array.from({{length:20}}, (_,i)=>i+1),
                datasets: [{{
                    label: 'Coeficientes',
                    data: [{mfcc_data}],
                    borderColor: '#7C4DFF',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(124,77,255,0.15)'
                }}]
            }},
            options: {{ maintainAspectRatio:false, plugins:{{legend:{{display:false}}}}, scales:{{ y:{{grid:{{color:'rgba(255,255,255,0.05)'}}}}, x:{{grid:{{display:false}}}} }} }}
        }});
    </script>
</body>
</html>'''

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    return True, "Rediseño completo con foto y top canciones"



if __name__ == "__main__":
    print(f"============================================================")
    print(f"🚀 INICIANDO V3: {len(VERIFIED_ARTISTS)} ARTISTAS Y DISEÑO MEJORADO")
    print(f"============================================================")
    
    updated = 0
    missing = 0
    
    for slug, info in sorted(VERIFIED_ARTISTS.items()):
        vocal_type, bio, songs = info
        artist_dir = os.path.join(ARTISTAS_DIR, slug)
        html_path = os.path.join(artist_dir, "index.html")
        
        # Recuperar nombre limpio del HTML
        if os.path.exists(html_path):
            with open(html_path, 'r', encoding='utf-8') as f:
                c = f.read()
                m = re.search(r'<h1>(.*?)</h1>', c)
                art_name = m.group(1).strip() if m else slug.replace("-", " ").title()
        else:
            art_name = slug.replace("-", " ").title()
            
        print(f"Procesando: {art_name} ({vocal_type})")
        
        # 1. Fetch Image via iTunes
        img_url = get_itunes_image_url(art_name)
        
        # 2. Update/Create HTML
        if os.path.exists(html_path):
            success, msg = upgrade_html(html_path, slug, vocal_type, bio, songs, img_url)
            if success:
                updated += 1
                print(f"   ✓ {msg}")
            else:
                print(f"   x Error: {msg}")
        else:
            print(f"   - Saltado: Sin archivo index.html original.")
            missing += 1

    print("\nRESUMEN:")
    print(f"Actualizados exitosamente: {updated}")
    print(f"No encontrados/Fallos:    {missing}")
    print("¡Hecho!")
