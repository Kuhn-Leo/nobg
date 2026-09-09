const base = "https://staticimgly.com/@imgly/background-removal-data/1.5.5/dist";
const tests = [
  base + "/f27ae13d9f59f61a6a1b5d9a91c203f2c613346083f02072c27c91672ccda8cf",
  base + "/models/isnet_quint8",
  base + "/models/" + "f27ae13d9f59f61a6a1b5d9a91c203f2c613346083f02072c27c91672ccda8cf",
  base + "/undefined",
];
for (const u of tests) {
  try {
    const r = await fetch(u);
    const b = await r.arrayBuffer();
    console.log(r.status, b.length, u.slice(base.length));
  } catch (e) {
    console.log("ERR", e.message.slice(0, 60), u.slice(base.length));
  }
}
