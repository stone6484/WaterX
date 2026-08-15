package com.waterx.safety.risk;

import com.waterx.safety.common.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class RiskCalculator {
    public Result calculate(String method, BigDecimal likelihood, BigDecimal severity,
                            BigDecimal exposure, BigDecimal consequence) {
        if (likelihood == null || likelihood.signum() <= 0) invalid("L 必须大于 0");
        BigDecimal value;
        if ("LS".equals(method)) {
            if (severity == null || severity.signum() <= 0) invalid("S 必须大于 0");
            if (likelihood.compareTo(BigDecimal.valueOf(5)) > 0 || severity.compareTo(BigDecimal.valueOf(5)) > 0)
                invalid("默认 LS 参数范围为 1–5");
            value = likelihood.multiply(severity);
            if (value.compareTo(BigDecimal.valueOf(7)) <= 0) return result(value, 4, "BLUE", "班组/岗位");
            if (value.compareTo(BigDecimal.valueOf(12)) <= 0) return result(value, 3, "YELLOW", "部门/车间");
            if (value.compareTo(BigDecimal.valueOf(16)) <= 0) return result(value, 2, "ORANGE", "厂级");
            return result(value, 1, "RED", "厂级主要负责人");
        }
        if ("LEC".equals(method)) {
            if (exposure == null || exposure.signum() <= 0 || consequence == null || consequence.signum() <= 0)
                invalid("LEC 方法的 E、C 必须大于 0");
            value = likelihood.multiply(exposure).multiply(consequence);
            if (value.compareTo(BigDecimal.valueOf(69)) <= 0) return result(value, 4, "BLUE", "班组/岗位");
            if (value.compareTo(BigDecimal.valueOf(159)) <= 0) return result(value, 3, "YELLOW", "部门/车间");
            if (value.compareTo(BigDecimal.valueOf(319)) <= 0) return result(value, 2, "ORANGE", "厂级");
            return result(value, 1, "RED", "厂级主要负责人");
        }
        throw new BusinessException("UNSUPPORTED_RISK_METHOD", "仅支持 LS 或 LEC 评估", HttpStatus.BAD_REQUEST);
    }

    private Result result(BigDecimal value, int level, String color, String controlLevel) {
        return new Result(value.setScale(2, RoundingMode.HALF_UP), level, color, controlLevel);
    }

    private void invalid(String message) {
        throw new BusinessException("INVALID_RISK_PARAMETER", message, HttpStatus.BAD_REQUEST);
    }

    public record Result(BigDecimal riskValue, int riskLevel, String riskColor, String controlLevel) {}
}
