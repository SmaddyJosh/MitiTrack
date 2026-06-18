import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        map: "MAP",
        dashboard: "DASHBOARD",
        about: "ABOUT",
        blog: "BLOG",
        home: "HOME"
      },
      hero: {
        title: "Forest Monitoring Designed for Action",
        description: "MitiTrack leverages AI and satellite imagery to identify degraded land and verify tree survival for global carbon markets.",
        subscribe: "SUBSCRIBE TO THE MITITRACK NEWSLETTER"
      },
      features: {
        dataTitle: "Discover the world’s forests through data",
        dataDesc: "Explore multispectral datasets to learn about conservation, land use, and plantable zones.",
        dataBtn: "EXPLORE OUR DATA",
        survivalTitle: "Be the first to see survival analytics",
        survivalDesc: "View, analyze, and subscribe to weekly AI alerts showing where tree cover is successfully growing.",
        survivalBtn: "VIEW SURVIVAL ALERTS"
      },
      footer: {
        dashboards: "DASHBOARDS",
        topics: "TOPICS",
        help: "HELP",
        subscribe: "SUBSCRIBE TO THE NEWSLETTER",
        status: "© 2026 MitiTrack System Status"
      },
      map: {
        title: "AI Land Reconnaissance",
        desc: "Identify optimal bare soil and degraded zones for afforestation using Sentinel-2 BSI and NDMI indices.",
        targetRegion: "Target Region",
        regions: {
            mtKenya: "Mount Kenya Slopes",
            aberdare: "Aberdare Edge",
            thika: "Thika River Basin"
        },
        scanning: "Ingesting Satellite Data...",
        scanComplete: "Scan Complete",
        runScan: "Run Suitability Scan",
        zoneDiscovered: "Planting Zone Discovered",
        areaSize: "Area Size:",
        confidence: "AI Confidence:",
        initiate: "Initiate Project",
        hectares: "Hectares",
        searchPlaceholder: "Search location...",
        searchBtn: "Search",
        selectedCoords: "Selected Coordinates:"
      }
    }
  },
  es: {
    translation: {
      nav: { map: "MAPA", dashboard: "TABLERO", about: "ACERCA DE", blog: "BLOG", home: "INICIO" },
      hero: {
        title: "Monitoreo Forestal Diseñado para la Acción",
        description: "MitiTrack aprovecha la IA y las imágenes satelitales para identificar tierras degradadas y verificar la supervivencia de árboles para los mercados globales de carbono.",
        subscribe: "SUSCRÍBETE AL BOLETÍN DE MITITRACK"
      },
      features: {
        dataTitle: "Descubre los bosques del mundo a través de datos",
        dataDesc: "Explora conjuntos de datos multiespectrales para aprender sobre conservación, uso de la tierra y zonas cultivables.",
        dataBtn: "EXPLORA NUESTROS DATOS",
        survivalTitle: "Sé el primero en ver los análisis de supervivencia",
        survivalDesc: "Ve, analiza y suscríbete a alertas semanales de IA que muestran dónde está creciendo con éxito la cobertura arbórea.",
        survivalBtn: "VER ALERTAS DE SUPERVIVENCIA"
      },
      footer: { dashboards: "TABLEROS", topics: "TEMAS", help: "AYUDA", subscribe: "SUSCRÍBETE AL BOLETÍN", status: "© 2026 Estado del Sistema MitiTrack" },
      map: {
        title: "Reconocimiento de Tierras por IA",
        desc: "Identifica suelos desnudos y zonas degradadas óptimas para la forestación utilizando índices BSI y NDMI de Sentinel-2.",
        targetRegion: "Región Objetivo",
        regions: { mtKenya: "Laderas del Monte Kenia", aberdare: "Borde de Aberdare", thika: "Cuenca del Río Thika" },
        scanning: "Ingiriendo Datos Satelitales...", scanComplete: "Escaneo Completo", runScan: "Ejecutar Escaneo de Idoneidad",
        zoneDiscovered: "Zona de Plantación Descubierta", areaSize: "Tamaño del Área:", confidence: "Confianza de IA:", initiate: "Iniciar Proyecto", hectares: "Hectáreas",
        searchPlaceholder: "Buscar ubicación...", searchBtn: "Buscar", selectedCoords: "Coordenadas seleccionadas:"
      }
    }
  },
  fr: {
    translation: {
      nav: { map: "CARTE", dashboard: "TABLEAU DE BORD", about: "À PROPOS", blog: "BLOG", home: "ACCUEIL" },
      hero: {
        title: "Surveillance Forestière Conçue pour l'Action",
        description: "MitiTrack s'appuie sur l'IA et l'imagerie satellite pour identifier les terres dégradées et vérifier la survie des arbres pour les marchés mondiaux du carbone.",
        subscribe: "ABONNEZ-VOUS À LA NEWSLETTER MITITRACK"
      },
      features: {
        dataTitle: "Découvrez les forêts du monde grâce aux données",
        dataDesc: "Explorez des ensembles de données multispectrales pour en savoir plus sur la conservation, l'utilisation des terres et les zones plantables.",
        dataBtn: "EXPLORER NOS DONNÉES",
        survivalTitle: "Soyez le premier à voir les analyses de survie",
        survivalDesc: "Consultez, analysez et abonnez-vous aux alertes hebdomadaires de l'IA indiquant où la couverture arborée se développe avec succès.",
        survivalBtn: "VOIR LES ALERTES DE SURVIE"
      },
      footer: { dashboards: "TABLEAUX DE BORD", topics: "SUJETS", help: "AIDE", subscribe: "S'ABONNER À LA NEWSLETTER", status: "© 2026 État du système MitiTrack" },
      map: {
        title: "Reconnaissance des Terres par IA",
        desc: "Identifiez les sols nus optimaux et les zones dégradées pour le boisement en utilisant les indices BSI et NDMI de Sentinel-2.",
        targetRegion: "Région Cible",
        regions: { mtKenya: "Pentes du Mont Kenya", aberdare: "Bordure d'Aberdare", thika: "Bassin de la Rivière Thika" },
        scanning: "Ingestion de Données Satellites...", scanComplete: "Analyse Terminée", runScan: "Lancer l'Analyse d'Adéquation",
        zoneDiscovered: "Zone de Plantation Découverte", areaSize: "Taille de la Zone :", confidence: "Confiance de l'IA :", initiate: "Initier le Projet", hectares: "Hectares",
        searchPlaceholder: "Rechercher un lieu...", searchBtn: "Rechercher", selectedCoords: "Coordonnées sélectionnées :"
      }
    }
  },
  sw: {
    translation: {
      nav: { map: "RAMANI", dashboard: "DASHBODI", about: "KUHUSU", blog: "BLOGU", home: "MWANZO" },
      hero: {
        title: "Ufuatiliaji wa Misitu Iliyoundwa kwa Hatua",
        description: "MitiTrack hutumia AI na picha za satelaiti kutambua ardhi iliyoharibiwa na kuthibitisha kuishi kwa miti kwa masoko ya kaboni ulimwenguni.",
        subscribe: "JIANDIKISHE KWA JARIDA LA MITITRACK"
      },
      features: {
        dataTitle: "Gundua misitu ya ulimwengu kupitia data",
        dataDesc: "Chunguza seti za data za wigo tofauti ili kujifunza juu ya uhifadhi, matumizi ya ardhi, na maeneo yanayoweza kupandwa.",
        dataBtn: "CHUNGUZA DATA ZETU",
        survivalTitle: "Kuwa wa kwanza kuona uchambuzi wa uhai",
        survivalDesc: "Tazama, changanua, na ujiandikishe kwa arifa za kila wiki za AI zinazoonyesha ambapo uoto wa miti unakua vizuri.",
        survivalBtn: "TAZAMA ARIFA ZA UHAI"
      },
      footer: { dashboards: "DASHBODI", topics: "MADA", help: "MSAADA", subscribe: "JIANDIKISHE KWA JARIDA", status: "© 2026 Hali ya Mfumo wa MitiTrack" },
      map: {
        title: "Upelelezi wa Ardhi kwa AI",
        desc: "Tambua udongo mtupu ulio bora na maeneo yaliyoharibiwa kwa upandaji miti kwa kutumia viashiria vya Sentinel-2 BSI na NDMI.",
        targetRegion: "Mkoa Lengo",
        regions: { mtKenya: "Miteremko ya Mlima Kenya", aberdare: "Ukingo wa Aberdare", thika: "Bonde la Mto Thika" },
        scanning: "Inaingiza Data ya Satelaiti...", scanComplete: "Uchanganuzi Umekamilika", runScan: "Endesha Uchanganuzi",
        zoneDiscovered: "Eneo la Kupanda Limegunduliwa", areaSize: "Ukubwa wa Eneo:", confidence: "Ujasiri wa AI:", initiate: "Anzisha Mradi", hectares: "Hekta",
        searchPlaceholder: "Tafuta eneo...", searchBtn: "Tafuta", selectedCoords: "Kuratibu Zilizochaguliwa:"
      }
    }
  },
  de: {
    translation: {
      nav: { map: "KARTE", dashboard: "DASHBOARD", about: "ÜBER UNS", blog: "BLOG", home: "STARTSEITE" },
      hero: {
        title: "Waldüberwachung für Handlungen konzipiert",
        description: "MitiTrack nutzt KI und Satellitenbilder, um geschädigtes Land zu identifizieren und das Überleben von Bäumen für globale Kohlenstoffmärkte zu verifizieren.",
        subscribe: "ABONNIEREN SIE DEN MITITRACK-NEWSLETTER"
      },
      features: {
        dataTitle: "Entdecken Sie die Wälder der Welt durch Daten",
        dataDesc: "Erkunden Sie multispektrale Datensätze, um mehr über Naturschutz, Landnutzung und bepflanzbare Zonen zu erfahren.",
        dataBtn: "ENTDECKEN SIE UNSERE DATEN",
        survivalTitle: "Seien Sie der Erste, der Überlebensanalysen sieht",
        survivalDesc: "Sehen, analysieren und abonnieren Sie wöchentliche KI-Warnungen, die zeigen, wo die Baumbedeckung erfolgreich wächst.",
        survivalBtn: "ÜBERLEBENSWARNUNGEN ANSEHEN"
      },
      footer: { dashboards: "DASHBOARDS", topics: "THEMEN", help: "HILFE", subscribe: "NEWSLETTER ABONNIEREN", status: "© 2026 MitiTrack Systemstatus" },
      map: {
        title: "KI-Landerkundung",
        desc: "Identifizieren Sie optimale offene Böden und geschädigte Zonen für die Aufforstung mit Sentinel-2 BSI- und NDMI-Indizes.",
        targetRegion: "Zielregion",
        regions: { mtKenya: "Hänge des Mount Kenya", aberdare: "Aberdare-Rand", thika: "Thika-Flussbecken" },
        scanning: "Satellitendaten werden geladen...", scanComplete: "Scan abgeschlossen", runScan: "Eignungsscan durchführen",
        zoneDiscovered: "Pflanzzone entdeckt", areaSize: "Gebietsgröße:", confidence: "KI-Konfidenz:", initiate: "Projekt initiieren", hectares: "Hektar",
        searchPlaceholder: "Ort suchen...", searchBtn: "Suchen", selectedCoords: "Ausgewählte Koordinaten:"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", 
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
