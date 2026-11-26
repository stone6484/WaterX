"""Build the private rev27 scene from the reviewed offline file and its CAD companion."""
import argparse
import base64
import hashlib
import json
import mimetypes
import re
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('scene_root', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
root = args.scene_root
main = (root / 'v01/青山湖数字孪生_本地预览.html').read_bytes()
if hashlib.sha256(main).hexdigest() != '5a6ca519716dc8398275ede6a6f27f29587d0c14b4da9bb88eed598fb6bf358e':
    raise SystemExit('Expected the reviewed rev27 offline source.')
cad = (root / 'index.html').read_text()
cad = cad.replace('<link rel="stylesheet" href="style.css">', '<style>' + (root / 'style.css').read_text() + '</style>')
def image(match):
    path = root / match[1]
    mime = mimetypes.guess_type(path.name)[0]
    return 'src="data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode() + '"'
def script(match):
    content = (root / match[1]).read_text().replace('</script', r'<\/script')
    return '<script>' + content + '</script>'
cad = re.sub(r'<script src="([^"]+)"></script>', script, cad)
cad = re.sub(r'src="(waterx-logo\.png|aeration\.svg)"', image, cad)
policy = """<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; frame-src about:; base-uri 'none'; form-action 'none'">"""
cad = cad.replace('<head>', '<head>' + policy, 1)
cad_string = json.dumps(cad, ensure_ascii=False).replace('<', r'\u003c')
dialog = """<dialog id="cad-review" style="width:96vw;height:94vh;max-width:none;max-height:none;padding:6px"><button type="button" id="close-cad">返回厂区</button><iframe title="原始 CAD 核图" style="display:block;width:100%;height:calc(100% - 38px);border:0" sandbox="allow-scripts"></iframe></dialog><script>
const cadReview=document.getElementById('cad-review');
document.addEventListener('click',e=>{
 const link=e.target.closest('a[href="../index.html"]');
 if(!link)return;
 e.preventDefault();
 cadReview.querySelector('iframe').srcdoc=CAD_DOCUMENT;
 cadReview.showModal();
},true);
document.getElementById('close-cad').onclick=()=>cadReview.close();
cadReview.addEventListener('close',()=>cadReview.querySelector('iframe').removeAttribute('srcdoc'));
</script>""".replace('CAD_DOCUMENT', cad_string)
html = main.decode().replace('<head>', '<head>' + policy, 1).replace('</body></html>', dialog + '</body></html>')
if 'id="cad-review"' not in html:
    raise SystemExit('Expected a complete scene document.')
args.output.write_bytes(html.encode())
print(hashlib.sha256(html.encode()).hexdigest())
