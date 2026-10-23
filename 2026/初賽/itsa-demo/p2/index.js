const $ = (id) => document.getElementById(id);
            const esc = (s) =>
                String(s).replace(
                    /[&<>"']/g,
                    (c) => "&#" + c.charCodeAt(0) + ";",
                );
            let S = null;
            const show = (on) => {
                $("loginV").hidden = on;
                $("appV").hidden = !on;
            };
            async function api(a, body) {
                const r = await fetch("team27.php?a=" + a, {
                    method: "POST",
                    headers: { "X-Requested-With": "fetch" },
                    body: JSON.stringify(body || {}),
                });
                if (r.status === 401) {
                    show(false);
                    throw 0;
                }
                return r.json();
            }
            async function refresh() {
                S = await api("state");
                render();
                show(true);
            }

            function render() {
                $("me").textContent = S.me;
                $("favs").innerHTML = S.favs
                    .map(
                        (g) =>
                            `<span class="badge text-bg-info me-1">${esc(g.name)} <a href="#" data-del="${g.id}" class="text-dark text-decoration-none">×</a></span>`,
                    )
                    .join("");
                const opts = S.favs
                    .map(
                        (g) =>
                            `<option value="${g.id}">${esc(g.name)}</option>`,
                    )
                    .join("");
                const pg = $("pubGame").value,
                    f0 = $("flt").value;
                $("pubGame").innerHTML =
                    '<option value="">-- 請選擇遊戲 --</option>' + opts;
                $("pubGame").value = pg;
                $("flt").innerHTML =
                    '<option value="">顯示所有我的喜愛遊戲</option>' + opts;
                $("flt").value = f0;
                const f = $("flt").value;
                $("board").innerHTML =
                    S.lobby
                        .filter((r) => !f || r.game_id == f)
                        .map(card)
                        .join("") ||
                    '<p class="text-secondary">目前沒有招募公告</p>';
                $("cal").innerHTML = S.cal
                    .map(
                        (
                            r,
                        ) => `<tr><td class="text-warning">${r.start_time}<td><span class="badge bg-secondary">${esc(r.game)}</span>
    <td><b class="text-info">${esc(r.host)}</b> 與另外 ${r.cnt - 1} 人<td>${r.cnt >= r.mx ? "滿員" : "已成局"}`,
                    )
                    .join("");
            }
            function card(r) {
                const formed = r.cnt >= r.mn,
                    pct = Math.min(100, (r.cnt / r.mx) * 100);
                return `<div class="col-12 col-md-6" id="c${r.id}"><div class="card card-body">
                            <div class="d-flex justify-content-between"><h5 class="text-info">${esc(r.game)}</h5>
                            <span class="badge ${formed ? "bg-success" : "bg-primary"}">${formed ? "已成局招募" : "招募中"}</span></div>
                            <div>時段: <b>${r.start_time}</b></div><div>發起隊長: <b>${esc(r.host)}</b></div>
                            <div class="d-flex justify-content-between"><small>成局門檻: ${r.mn}人</small><b>${r.cnt} / ${r.mx} 人</b></div>
                            <div class="progress mb-2" style="height:6px"><div class="progress-bar" style="width:${pct}%"></div></div>
                            ${r.joined ? '<button class="btn btn-secondary" disabled>你已在隊伍中</button>' : `<button class="btn btn-primary" data-join="${r.id}">我加入</button>`}
                        </div></div>`;
            }

            $("go").onclick = async () => {
                const r = await fetch("team27.php?a=login", {
                    method: "POST",
                    headers: { "X-Requested-With": "fetch" },
                    body: JSON.stringify({ u: $("u").value, p: $("p").value }),
                });
                const j = await r.json();
                if (j.error) $("err").textContent = j.error;
                else refresh();
            };
            $("out").onclick = async () => {
                await api("logout");
                show(false);
            };
            $("add").onclick = async () => {
                S = await api("addfav", { name: $("newGame").value });
                $("newGame").value = "";
                render();
            };
            $("pub").onclick = async () => {
                const j = await api("publish", {
                    game: $("pubGame").value,
                    when: $("when").value,
                    min: $("mn").value,
                    max: $("mx").value,
                });
                if (j.error) alert(j.error);
                else {
                    S = j;
                    render();
                }
            };
            $("flt").onchange = render;
            $("t1").onclick = (e) => {
                e.preventDefault();
                tab(1);
            };
            $("t2").onclick = (e) => {
                e.preventDefault();
                tab(2);
            };
            function tab(n) {
                $("boardV").hidden = n != 1;
                $("calV").hidden = n != 2;
                $("t1").classList.toggle("active", n == 1);
                $("t2").classList.toggle("active", n == 2);
            }
            document.addEventListener("click", async (e) => {
                const d = e.target.dataset;
                if (d.del) {
                    e.preventDefault();
                    S = await api("delfav", { id: d.del });
                    render();
                }
                if (d.join) {
                    const id = d.join,
                        el = $("c" + id);
                    const j = await api("join", { id });
                    if (j.error) {
                        alert(j.error);
                        return refresh();
                    }
                    S = j;
                    if (!S.lobby.some((r) => r.id == id)) {
                        el.classList.add("fade-out");
                        setTimeout(render, 500);
                    } else render();
                }
            });
            refresh().catch(() => {});
            setInterval(() => {
                if (!$("appV").hidden) refresh().catch(() => {});
            }, 5000);
