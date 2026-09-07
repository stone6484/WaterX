package com.waterx.safety.process;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.springframework.stereotype.Component;
import java.math.*;
import java.util.*;
import java.util.function.*;
import java.util.regex.*;

/** Server-owned calculations for the frozen PM-0.1.1 rules; parity fixtures come from the existing TS engine. */
@Component
public class ProcessCalculator {
    public static final String RULE="PM-0.1.1（项目参数待校核）";
    private final ObjectMapper json;private final JsonNode descriptions;
    private interface Reader {double read(String id,boolean design);default double get(String id){return read(id,false);}}
    private final Map<String,ToDoubleFunction<Reader>> formulas=new HashMap<>();
    public ProcessCalculator(ObjectMapper json)throws Exception{
        this.json=json;descriptions=json.readTree(getClass().getResourceAsStream("/process-formula-descriptions.json"));
        for(String[] p:new String[][]{{"VFA/COD","VFA","COD"},{"SCOD/COD","SCOD","COD"},{"BOD₅/COD","BOD₅","COD"},{"SS/COD","SS","COD"},{"COD/TN","COD","TN"},{"BOD₅/TN","BOD₅","TN"},{"碱度/NH₃-N","总碱度","NH₃-N"},{"NH₃-N/TN","NH₃-N","TN"},{"COD/TP","COD","TP"},{"BOD₅/TP","BOD₅","TP"},{"PO₄-P/TP","PO₄-P","TP"}})formulas.put("进水特征::"+p[0],r->div(r.get("进水水质::"+p[1]),r.get("进水水质::"+p[2])));
        for(String n:List.of("COD","BOD₅","SS","NH₃-N","TN","TP"))formulas.put("处理效能::"+n+"去除率",r->div(r.get("进水水质::"+n)-r.get("出水水质::"+n),r.get("进水水质::"+n))*100);
        formulas.put("污泥性状::MLVSS/MLSS",r->div(r.get("污泥性状::MLVSS"),r.get("污泥性状::MLSS")));
        formulas.put("污泥性状::SVI",r->div(r.get("污泥性状::SV30")*10000,r.get("污泥性状::MLSS")));
        for(String[] p:new String[][]{{"BOD₅/MLSS","BOD₅","MLSS"},{"COD/MLSS","COD","MLSS"},{"BOD/MLVSS","BOD₅","MLVSS"},{"NH₃/MLVSS","NH₃-N","MLVSS"},{"TN/MLVSS","TN","MLVSS"},{"NO₃-N/MLSS","NO₃-N","MLSS"}})formulas.put("污泥性状::"+p[0],r->div(r.get("进水水质::"+p[1]),r.get("污泥性状::"+p[2])));
        String flow="水量控制::日进水量";
        formulas.put("水量控制::水量负荷率",r->div(r.get(flow),r.read("水量控制::设计处理水量",true))*100);
        for(String n:List.of("厌氧段","缺氧段","好氧段"))formulas.put("水量控制::"+n+"HRT",r->div(r.read("水量控制::"+n+"有效池容",true),r.get(flow))*24);
        formulas.put("水量控制::总HRT",r->div(r.read("水量控制::厌氧段有效池容",true)+r.read("水量控制::缺氧段有效池容",true)+r.read("水量控制::好氧段有效池容",true),r.get(flow))*24);
        for(String n:List.of("单位水量曝气量","当前气水比"))formulas.put("曝气控制::"+n,r->div(r.get("曝气控制::日曝气量"),r.get(flow)));
        for(String n:List.of("内回流","外回流"))formulas.put("回流控制::"+n+"比",r->div(r.get("回流控制::"+n+"量"),r.get(flow))*100);
        formulas.put("加药控制::吨水药耗",r->div((r.get("加药控制::碳源投加量")+r.get("加药控制::除磷药剂量"))*1000,r.get(flow)*10000));
        formulas.put("曝气控制::填料投加容积比",r->div(r.read("曝气控制::投加填料总体积",true),r.read("曝气控制::MBBR填料区池容",true))*100);
    }
    private static double div(double a,double b){if(b==0)throw new IllegalArgumentException("分母为0");return a/b;}
    public static Double numeric(String value){
        String s=value.trim();if(s.isEmpty())return null;
        Matcher m=Pattern.compile("([0-9.]+)\\s*[×x]\\s*10([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)").matcher(s);StringBuffer b=new StringBuffer();
        while(m.find())m.appendReplacement(b,Matcher.quoteReplacement(m.group(1)+"e"+superscript(m.group(2))));m.appendTail(b);s=b.toString();
        m=Pattern.compile("^10([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)$").matcher(s);if(m.matches())s="1e"+superscript(m.group(1));
        if(!s.matches("[+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?"))return null;
        try{double n=Double.parseDouble(s);return Double.isFinite(n)?n:null;}catch(Exception e){return null;}
    }
    private static String superscript(String s){StringBuilder b=new StringBuilder();for(char c:s.toCharArray()){int n="⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c);b.append(n<0?"-":String.valueOf(n));}return b.toString();}
    // Match JS toFixed on the actual binary double, including 4.00005 -> 4.0000.
    private static String rounded(double n){return new BigDecimal(n).setScale(4,RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();}
    static double[] bounds(String value){Matcher m=Pattern.compile("^([+-]?[0-9]+(?:\\.[0-9]+)?)\\s*[～~至]\\s*([+-]?[0-9]+(?:\\.[0-9]+)?)$").matcher(value.trim());if(!m.matches())return null;double a=Double.parseDouble(m.group(1)),b=Double.parseDouble(m.group(2));return a<=b?new double[]{a,b}:null;}
    public static String targetError(JsonNode t){
        double w=t.path("warning").asDouble(Double.NaN),a=t.path("alarm").asDouble(Double.NaN);String mode=t.path("mode").asText(),v=t.path("value").asText();
        if(!Set.of("POINT","RANGE","UPPER","LOWER","TEXT","REFERENCE").contains(mode))return "控制方式不正确";
        if(!Double.isFinite(w)||!Double.isFinite(a)||w<0||a<w)return "容差必须是非负数，告警容差不得小于预警容差";
        if(v.isBlank()||v.equals("—"))return "";
        if(mode.equals("RANGE")&&bounds(v)==null)return "区间请填写“下限～上限”，且下限不得大于上限";
        if(Set.of("POINT","UPPER","LOWER").contains(mode)&&numeric(v)==null)return "目标必须为完整数字";return "";
    }
    private String description(JsonNode m){return descriptions.path(m.path("id").asText()).asText(m.path("source").asText().equals("CALCULATED")?"待补充项目模型、明确输入与公式；不得使用预置结果":"");}
    private record Value(String value,String data,String source,String message){}
    public ArrayNode calculate(JsonNode metrics,JsonNode design,JsonNode targets,JsonNode cells){
        Map<String,JsonNode> catalog=new LinkedHashMap<>();metrics.forEach(m->catalog.put(m.path("id").asText(),m));Map<String,Value> cache=new HashMap<>();Set<String> visiting=new HashSet<>();
        class Resolver {
            Value resolve(String id){
                if(cache.containsKey(id))return cache.get(id);JsonNode m=catalog.get(id);if(m==null)return new Value("","MISSING","依赖","缺少依赖指标 "+id);
                String source=m.path("source").asText();Value result;
                if(source.equals("DESIGN")){String v=design.path(id).asText();result=new Value(v,!v.isEmpty()&&!v.equals("—")?"VALID":"MISSING","设计标准","固定设计属性，仅参考");}
                else if(source.equals("CALCULATED")){
                    if(!formulas.containsKey(id))result=new Value("","UNCONFIGURED","受控计算",description(m));
                    else if(visiting.contains(id))result=new Value("","CALC_INVALID","受控计算","公式循环依赖");
                    else{visiting.add(id);try{double value=formulas.get(id).applyAsDouble((dep,isDesign)->{Value v=isDesign?new Value(design.path(dep).asText(),"VALID","",""):resolve(dep);Double n=numeric(v.value());if(!v.data().equals("VALID")||n==null||(isDesign&&n<=0))throw new IllegalArgumentException("依赖不可用："+dep+" "+(isDesign?"应为正数设计参数":v.message()));return n;});if(!Double.isFinite(value))throw new IllegalArgumentException("结果非有限数");result=new Value(rounded(value),"VALID","受控计算",description(m));}catch(IllegalArgumentException e){result=new Value("","CALC_INVALID","受控计算",e.getMessage());}finally{visiting.remove(id);}}
                }else{JsonNode c=cells.path(id);String value=c.path("value").asText().trim(),name=m.path("name").asText();Double n=numeric(value);boolean invalid=!m.path("text").asBoolean()&&(n==null||(name.equals("pH")&&(n<0||n>14))||(n<0&&!Pattern.compile("ORP|温度|^T$").matcher(name).find()));String data=c.path("state").asText().equals("NA")?"NA":c.path("state").asText().equals("INVALID")?"INVALID":value.isEmpty()?"MISSING":invalid?"INVALID":"VALID";result=new Value(value,data,c.path("source").asText().equals("DEMO")?"示范填入":c.path("source").asText().equals("IMPORT")?"表格导入":"人工填报",c.path("note").asText());}
                cache.put(id,result);return result;
            }
        }
        Resolver resolver=new Resolver();ArrayNode rows=json.createArrayNode();Map<String,String> modes=Map.of("POINT","定值","RANGE","区间","UPPER","上限","LOWER","下限","TEXT","文本匹配","REFERENCE","仅参考");
        for(JsonNode m:metrics){if(!m.path("scopes").toString().contains("\"diagnosis\""))continue;String id=m.path("id").asText();Value v=resolver.resolve(id);JsonNode t=targets.path(id);String mode=t.path("mode").asText(),target=t.path("value").asText();ObjectNode row=rows.addObject();for(String f:List.of("id","code","category","name","unit"))row.put(f,m.path(f).asText());row.put("design",design.path(id).asText().isEmpty()?"未维护":design.path(id).asText());row.put("target",t.isMissingNode()?"未配置":(mode.equals("UPPER")?"≤":mode.equals("LOWER")?"≥":"")+target);row.put("actual",v.value()).put("data",v.data()).put("state","pending").putNull("deviation").putNull("difference").put("explanation",v.message()).put("source",v.source()).put("formula",description(m)).put("rule","未匹配有效工况或未配置目标");
            if(!v.data().equals("VALID"))continue;if(m.path("source").asText().equals("DESIGN")){row.put("state","reference");continue;}if(t.isMissingNode()||target.isBlank()||target.equals("—"))continue;
            if(mode.equals("REFERENCE")){row.put("state","reference").put("rule","仅参考，不纳入正常/预警/告警计数");continue;}String error=targetError(t);if(!error.isEmpty()){row.put("rule",error);continue;}
            row.put("rule",modes.get(mode)+"；预警容差 "+number(t.path("warning").asDouble())+"%，告警容差 "+number(t.path("alarm").asDouble())+"%（项目待校核）；零目标按绝对偏差，任何非零偏差预警");
            if(mode.equals("TEXT")){boolean same=v.value().equals(target);row.put("state",same?"normal":"warning").put("explanation",same?"文本一致":"文本不一致，需核查；不自动等同“未检出”和“无”");continue;}
            Double n=numeric(v.value());if(n==null){row.put("data","INVALID");continue;}Double targetNumber=numeric(target);double base=targetNumber==null?0:targetNumber;
            if(mode.equals("RANGE")){double[] b=bounds(target);base=n<b[0]?b[0]:n>b[1]?b[1]:n;}
            double diff=n-base,distance=mode.equals("UPPER")?Math.max(0,diff):mode.equals("LOWER")?Math.max(0,-diff):Math.abs(diff);row.put("difference",diff);if(base!=0)row.put("deviation",diff/Math.abs(base)*100);
            double pct=base==0?0:distance/Math.abs(base)*100;row.put("state",distance==0?"normal":base==0?"warning":pct<=t.path("warning").asDouble()?"normal":pct<=t.path("alarm").asDouble()?"warning":"alarm");row.put("explanation",(mode.equals("RANGE")&&distance==0?"范围内":distance==0?"满足目标":"相对控制基准差值 "+rounded(diff)+" "+m.path("unit").asText())+"。运行偏差提示，不代表法定达标判定。"+v.message());
        }return rows;
    }
    private static String number(double n){return BigDecimal.valueOf(n).stripTrailingZeros().toPlainString();}
}
