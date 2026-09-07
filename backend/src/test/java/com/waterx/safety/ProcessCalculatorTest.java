package com.waterx.safety;
import com.fasterxml.jackson.databind.*;
import com.waterx.safety.process.ProcessCalculator;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class ProcessCalculatorTest {
 @Test void frozenRulesMatchExistingEngineAcross828Rows()throws Exception{
  ObjectMapper json=new ObjectMapper();var calculator=new ProcessCalculator(json);
  for(JsonNode c:json.readTree(getClass().getResourceAsStream("/process-calculator-parity.json"))){
   var actual=calculator.calculate(c.path("metrics"),c.path("design"),c.path("targets"),c.path("cells"));var expected=c.path("rows");assertEquals(expected.size(),actual.size());
   for(int i=0;i<expected.size();i++){var e=expected.get(i);var a=actual.get(i);var fields=e.fields();while(fields.hasNext()){var f=fields.next();String label=c.path("name").asText()+" / "+e.path("id").asText()+" / "+f.getKey();if(f.getValue().isNumber())assertEquals(f.getValue().asDouble(),a.path(f.getKey()).asDouble(),1e-8,label);else assertEquals(f.getValue(),a.path(f.getKey()),label);}}
  }
 }
}
