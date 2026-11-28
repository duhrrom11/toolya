// Read-only review evidence, never a release waiver.
import {translateToolDialog,translateToolRuntimeStatus} from '../shared/toolya/i18n/interface.mjs';
import {wishesText} from '../shared/toolya/i18n/wishes-copy.mjs';
import {estateText} from '../shared/toolya/i18n/estate-copy.mjs';
import {dashboardText} from '../shared/toolya/i18n/dashboard-copy.mjs';
import {adminText} from '../shared/toolya/i18n/admin-copy.mjs';
export function reviewRuntimeLiteral(file,literal,expression,following=''){
 const tool=file.match(/^tools\/(moving|housemates|plants|baking|budget|car|loans|meters|parking|pet-health)\//)?.[1];
 const family=tool?'tool:'+tool:file.startsWith('tools/wishes/')?'wishes':file.startsWith('tools/estate/')||/^assets\/estate-/.test(file)?'estate':file.startsWith('dashboard/')?'dashboard':file.startsWith('admin-stats-dashboard/')?'admin':null;
 const state=(catalogueState,extra={})=>({catalogueState,family,...extra});
 if(!family)return state('shared-context-review');
 // Concatenation, interpolation, HTML markup and escaped literals are not complete messages.
 if(/\$\{/.test(literal)||/^\s*\+/.test(following)||/\binnerHTML\s*=/.test(expression))return state('composite-source-review');
 // Decode only unambiguous newline escapes in complete static messages.
 // Unknown escapes remain review candidates; never evaluate source code.
 if(/\\(?!n)/.test(literal))return state('composite-source-review');
 literal=literal.replace(/\\n/g,'\n');
 const translators=tool?[v=>translateToolDialog(tool,'en',v),v=>translateToolRuntimeStatus(tool,'en',v)]:[v=>({wishes:wishesText,estate:estateText,dashboard:dashboardText,admin:adminText}[family])(v,'en')];
 for(const translate of translators){const english=translate(literal);if(english!==literal)return state('catalogue-match-runtime-unverified',{english,decodedLiteral:literal});}
 return state('no-catalogue-match-review');
}
