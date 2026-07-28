import eastSumbaHinggi from '@/assets/textiles/east-sumba-hinggi.jpg'
import lembataIkat from '@/assets/textiles/lembata-ikat.jpg'
import floresWeaver from '@/assets/textiles/flores-weaver.jpg'
import baliEndek from '@/assets/textiles/bali-endek.jpg'
import ikatWeaverArchive from '@/assets/textiles/ikat-weaver-archive.jpg'
import sumbaDyeThreads from '@/assets/textiles/sumba-dye-threads.jpg'
import trosoLoom from '@/assets/textiles/troso-loom.jpg'

export const TextileSources = {
  eastSumbaHinggi: {
    imageUrl: eastSumbaHinggi,
    imageAlt: 'Kain bahu pria tenun ikat lusi berwarna nila dan merah karat dari Sumba Timur',
    title: 'Kain bahu pria (Hinggi), awal abad ke-20',
    region: 'Sumba Timur, Kerajaan Kapunduk',
    license: 'Domain publik',
    credit: 'Honolulu Museum of Art',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Man%E2%80%99s_Shoulder_Cloth_%28Hinggi%29%2C_early_20th_century%3B_cotton%3B_warp_ikat%3B_Indonesia%2C_East_Sumba%2C_Kingdom_of_Kapunduk.jpg',
  },
  lembataIkat: {
    imageUrl: lembataIkat,
    imageAlt: 'Kain ikat mas kawin pengantin berwarna merah, nila, dan serat alami dari Ili Api, Lembata',
    title: 'Kain ikat mas kawin wanita',
    region: 'Ili Api, Lembata, Indonesia',
    license: 'CC0',
    credit: 'Honolulu Museum of Art',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Woman%27s_ikat_bridewealth_Ili_Api%2C_Lembata%2C_Indonesia%2C_Honolulu_Museum_of_Art_10534.1.JPG',
  },
  floresWeaver: {
    imageUrl: floresWeaver,
    imageAlt: 'Perempuan dari Flores duduk di alat tenun membuat kain',
    title: 'Perempuan dari Flores membuat kain',
    region: 'Flores, Indonesia',
    license: 'Domain publik',
    credit: 'Indonesia Tanah Airku, hlm. 60',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Woman_from_Flores_making_a_textile%2C_Indonesia_Tanah_Airku%2C_p60.jpg',
  },
  baliEndek: {
    imageUrl: baliEndek,
    imageAlt: 'Kain endek upacara tenun ikat pakan dari Buleleng, Bali, dengan motif geometris merah dan emas',
    title: 'Kain endek upacara, akhir abad ke-19',
    region: 'Buleleng, Bali, Indonesia',
    license: 'Domain publik',
    credit: 'Honolulu Academy of Arts',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:%27Kain_endek%27_(ceremonial_ikat_hanging)_from_Buleleng,_Bali,_Indonesia.jpg',
  },
  ikatWeaverArchive: {
    imageUrl: ikatWeaverArchive,
    imageAlt: 'Foto arsip perempuan menenun kain ikat dengan alat tenun tradisional',
    title: 'Perempuan menenun kain ikat',
    region: 'Indonesia',
    license: 'Domain publik',
    credit: 'Indonesia Tanah Airku, hlm. 17',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Woman_making_ikat_weave,_Indonesia_Tanah_Airku,_p17.jpg',
  },
  sumbaDyeThreads: {
    imageUrl: sumbaDyeThreads,
    imageAlt: 'Benang tenun ikat Sumba dijemur setelah dicelup pewarna',
    title: 'Benang tenun ikat Sumba setelah pencelupan',
    region: 'Sumba, Indonesia',
    license: 'CC BY-SA 4.0',
    credit: '06Ivonne',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Tenun_Ikat_Sumba.jpg',
  },
  trosoLoom: {
    imageUrl: trosoLoom,
    imageAlt: 'Alat tenun bukan mesin untuk membuat kain tenun ikat Troso',
    title: 'Alat tenun bukan mesin (ATBM) Troso',
    region: 'Troso, Jepara, Indonesia',
    license: 'CC BY-SA 4.0',
    credit: 'WikiEditorID',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Tenun_ikat_troso.jpg',
  },
} as const

export type TextileSource = typeof TextileSources[keyof typeof TextileSources]
