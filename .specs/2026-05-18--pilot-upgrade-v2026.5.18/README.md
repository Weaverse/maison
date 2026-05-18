# Feature: Pilot Upgrade — Port v2026.5.18 features to Maison

| Field            | Value                                                    |
| ---------------- | -------------------------------------------------------- |
| **Status**       | in-progress                                              |
| **Owner**        | @leehoang                                                |
| **Created**      | 2026-05-18                                               |
| **Last Updated** | 2026-05-18                                               |
| **Branch**       | `update/v1.0.0-to-v2026.5.18`                            |

## Original Prompt

> /theme-update thực thi skill theme-update cho dự án Weaverse Pilot để kiểm tra phiên bản mới nhất, tổng hợp các cải tiến/tính năng mới và lập kế hoạch nâng cấp an toàn cho Maison
>
> Trước khi thực hiện cần liệt kê, brainstorm với tôi trước
>
> Quyết định sau brainstorm:
> 1. Cả 3, scan pilot và đưa ra các feature, version trước khi apply vào maison
> 2. All (core deps, sections, bug fixes, schema)
> 3. Cần xử lý phần này an toàn chút. Tôn trọng các feat riêng của b2b nói riêng hay maison nói chung
> 4. Làm trên dev-lee hiện tại (đã chuyển sang nhánh update/v1.0.0-to-v2026.5.18)
>
> Đồng ý chia 4 Epic. Ưu tiên SỬA LỖI TRƯỚC, gom thay đổi rủi ro cao lại làm sau. Quản lý tiến độ rất rõ ràng. Đảm bảo AN TOÀN TUYỆT ĐỐI cho Maison.

## Summary

Audit Pilot theme (currently at v2026.5.18) for features, fixes, and improvements that should be ported to Maison (currently at `@weaverse/maison` v1.0.0). Maison and Pilot are sibling projects sharing common Weaverse Hydrogen architecture but with significant divergence — Maison has B2B, variant-list (bulk order), Klaviyo, Judge.me, Ali Reviews, and many Maison-only sections. The upgrade is split into 4 epics ordered by risk: bug fixes first (safest), then features (selective), then dependencies (high risk), then refactors (highest risk — optional).
