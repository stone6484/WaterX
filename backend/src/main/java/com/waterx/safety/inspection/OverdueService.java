package com.waterx.safety.inspection;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class OverdueService {
    private final JdbcClient jdbc;
    public OverdueService(JdbcClient jdbc) { this.jdbc = jdbc; }

    @Scheduled(cron = "0 10 * * * *", zone = "Asia/Shanghai")
    public void refresh() {
        jdbc.sql("update inspection_task set status='OVERDUE' where status in ('PENDING','IN_PROGRESS') and due_at<now()").update();
        jdbc.sql("update safety_hazard set status='OVERDUE',updated_at=now() where status in ('OPEN','RECTIFYING') and due_date<:today")
                .param("today", LocalDate.now()).update();
    }
}
