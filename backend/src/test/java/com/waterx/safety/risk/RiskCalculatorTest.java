package com.waterx.safety.risk;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class RiskCalculatorTest {
    private final RiskCalculator calculator = new RiskCalculator();

    @Test
    void calculatesLsBoundaryLevels() {
        assertThat(calculator.calculate("LS", new BigDecimal("1.4"), n(5), null, null).riskLevel()).isEqualTo(4);
        assertThat(calculator.calculate("LS", n(3), n(4), null, null).riskColor()).isEqualTo("YELLOW");
        assertThat(calculator.calculate("LS", n(4), n(4), null, null).riskColor()).isEqualTo("ORANGE");
        assertThat(calculator.calculate("LS", n(5), n(5), null, null).riskColor()).isEqualTo("RED");
    }

    @Test
    void calculatesLec() {
        var result = calculator.calculate("LEC", n(3), null, n(6), n(15));
        assertThat(result.riskValue()).isEqualByComparingTo("270");
        assertThat(result.riskLevel()).isEqualTo(2);
    }

    private BigDecimal n(int value) { return BigDecimal.valueOf(value); }
}
