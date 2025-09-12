import { internalAction } from "./_generated/server";

const COOKIE = `nmstat=5347ae69-fc39-017d-5be1-c747cc5c798b; _fbp=fb.1.1742492410804.25217141481684384; cebs=1; _mkto_trk=id:131-AQO-225&token:_mch-washington.edu-3dbd83a75f74029c461961c07ab6a7fa; _clck=57sla2%7C2%7Cfvq%7C0%7C1954; __utmc=80390417; _ga_6PNRL82PD4=GS2.1.s1748575255$o1$g1$t1748575287$j28$l0$h0; _ga_VLXYEPDF94=GS2.1.s1748575255$o1$g1$t1748575287$j28$l0$h0; _ga_ZSJL1C6YJ5=GS2.1.s1750584497$o1$g0$t1750584501$j56$l0$h0; _gcl_au=1.1.642359019.1750637329; _ga_25XGC4P1F5=GS2.2.s1750704337$o3$g0$t1750704337$j60$l0$h0; _ga_C854SEMWV6=GS2.2.s1750891748$o3$g1$t1750891771$j37$l0$h0; _ga_XSBFHD17M5=GS2.1.s1751471957$o1$g1$t1751471990$j27$l0$h0; _ga_CPBMNL5L6C=GS2.1.s1751500452$o4$g0$t1751500453$j59$l0$h0; _ga_3L5RZ9EB10=GS2.1.s1753945806$o6$g1$t1753945991$j45$l0$h0; ps_rvm_fZxi=%7B%22pssid%22%3A%22DU4JbhiivBL6N5Hg-1753945985783%22%2C%22opening-catcher%22%3A1752785267093%2C%22last-visit%22%3A%221753945991610%22%7D; _hjSessionUser_5349179=eyJpZCI6ImI5Y2FhNzM5LWJiODctNWIxNi1hYWRmLTkwY2Q2NjIwYWRlNyIsImNyZWF0ZWQiOjE3NTM5OTE3NDU4ODksImV4aXN0aW5nIjpmYWxzZX0=; _ga_57P4HTBKTG=GS2.1.s1753991736$o1$g1$t1753991755$j41$l0$h0; __utmz=80390417.1754257279.5.4.utmcsr=bing|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided); __utma=80390417.1069828593.1742492411.1754257279.1754289666.6; _ga_HZC6629TRG=GS2.2.s1754530407$o3$g0$t1754530407$j60$l0$h0; _ga_DCJXF1RLXE=GS2.1.s1754589704$o2$g0$t1754589706$j58$l0$h0; _ga_RT5WKYNTQV=GS2.1.s1756142047$o1$g0$t1756142050$j57$l0$h0; _ga_4DEGMHTN3T=GS2.2.s1756176430$o6$g0$t1756176430$j60$l0$h0; _ga_67C94ZRNEY=GS2.1.s1756182140$o8$g1$t1756182166$j34$l0$h0; _ga_SHNBKYT066=GS2.1.s1756182140$o15$g1$t1756182166$j34$l0$h0; _opensaml_req_ss%3Amem%3A4e19265518e4c99e7cd7f36db64e4357fa9cfa66c4a504138da8dccd7c95d191=_5992a9d33102496cae858e6122d42aee; _shibsession_64656661756c7468747470733a2f2f7777772e77617368696e67746f6e2e6564752f73686962626f6c657468=_e5f66cb8ab43cedf135e5a046c831d51; _ga_E1YV43XFCK=GS2.2.s1757348304$o15$g0$t1757348304$j60$l0$h0; _ga=GA1.1.1069828593.1742492411; _ce.clock_data=-22%2C24.16.131.242%2C1%2Cd4b195aa3e3df8470a1db60707730a8c%2CEdge%2CUS; cebsp_=25; _ce.s=v~c202540d6dd15891cb1935165499071cb28b967d~lcw~1757593599366~vir~returning~lva~1757593599061~vpv~0~v11.fhb~1746679454978~v11.lhb~1746720818846~v11ls~91003440-8f0a-11f0-9b3e-1d94ae3e71d0~v11slnt~1754530407616~v11.cs~458693~v11.s~91003440-8f0a-11f0-9b3e-1d94ae3e71d0~v11.vs~c202540d6dd15891cb1935165499071cb28b967d~v11.fsvd~eyJ1cmwiOiJ3YXNoaW5ndG9uLmVkdS9tYXBzIiwicmVmIjoiaHR0cDovL2xvY2FsaG9zdDozMDAwLyIsInV0bSI6W119~v11.sla~1757593599365~v11.wss~1757593599365~v11.ss~1757593599366~lcw~1757593599368; _affinity=w12|aMLAc; _ga_3T65WK0BM8=GS2.1.s1757593598$o20$g1$t1757593710$j60$l0$h0; _ga_JLHM9WH4JV=GS2.1.s1757593598$o20$g1$t1757593710$j60$l0$h0`

export type Location = {
  id: number;
  title: string;
  code: string;
  lat: number;
  lng: number;
  rad: number;
  image: string;
  body: string;
  category: string[];
  type: string;
}

export const getLocations = internalAction({
  handler: async (ctx) => {
    const response = await fetch("https://www.washington.edu/maps/?json=campusmap.get_locations", {
      "headers": {
        "accept": "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
        "priority": "u=1, i",
        "sec-ch-ua": "\"Not;A=Brand\";v=\"99\", \"Microsoft Edge\";v=\"139\", \"Chromium\";v=\"139\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        "cookie": COOKIE,
        "Referer": "https://www.washington.edu/maps/"
      },
      "body": null,
      "method": "GET"
    });
    const data = await response.json();
    return data as {
      count: number;
      posts: Location[];
      status: string;
    };
  },
})