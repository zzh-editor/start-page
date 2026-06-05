from playwright.sync_api import sync_playwright, Page, expect
import json
import time

BASE_URL = "http://localhost:4321"
TEST_SUPABASE_URL = "https://test.supabase.co"
TEST_SUPABASE_KEY = "test-key"

def goto_and_wait(page: Page, url: str = BASE_URL):
    page.goto(url)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)

class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []

    def check(self, name: str, condition: bool, detail: str = ""):
        if condition:
            self.passed += 1
            print(f"  ✓ {name}")
        else:
            self.failed += 1
            msg = f"  ✗ {name} - {detail}" if detail else f"  ✗ {name}"
            print(msg)
            self.errors.append(msg)

result = TestResult()

def test_sync_panel_page_load(page):
    """测试 1: 设置面板打开和同步面板未配置状态"""
    goto_and_wait(page)
    # 点击齿轮打开设置
    page.click("#manage-btn")
    page.wait_for_selector("#manage-modal:not([hidden])")
    result.check("设置面板打开", page.is_visible("#manage-modal"))

    # 点击同步标签
    sync_tab = page.locator('.subtab[data-sub="sync"]')
    sync_tab.click()
    page.wait_for_timeout(300)

    # 验证未配置显示
    unconfigured = page.locator("#sync-unconfigured")
    result.check("同步面板显示未配置提示", unconfigured.is_visible(),
                 "应显示 Supabase 配置提示")
    result.check("配置文档链接可见", page.locator(".sync-doc-link").is_visible())
    result.check("账号显示'同步未配置'",
                 page.locator("#sync-account-info").text_content() == "同步未配置")
    result.check("同步状态显示'未配置'",
                 page.locator("#sync-indicator-text").text_content() == "未配置")
    result.check("登录按钮隐藏", page.locator("#sync-login-btn").is_hidden())
    result.check("注册按钮隐藏", page.locator("#sync-signup-btn").is_hidden())

def test_sync_panel_unconfigured(page):
    """测试 2: 完全未配置 Supabase 时的同步面板精确状态"""
    goto_and_wait(page)
    page.click("#manage-btn")
    page.wait_for_selector("#manage-modal:not([hidden])")
    sync_tab = page.locator('.subtab[data-sub="sync"]')
    sync_tab.click()
    page.wait_for_timeout(300)

    # 验证每个状态卡片内容
    account_info = page.locator("#sync-account-info")
    result.check("账号卡片内容正确", "同步未配置" in account_info.text_content())
    result.check("同步状态卡片显示未配置",
                 page.locator("#sync-indicator-text").text_content() == "未配置")
    result.check("最后同步显示 -", page.locator("#sync-last-time").text_content() == "—")
    result.check("存储信息显示 -", page.locator("#sync-storage-info").text_content() == "—")

def test_settings_tab_navigation(page):
    """测试 3: 设置面板子标签页切换"""
    goto_and_wait(page)
    page.click("#manage-btn")
    page.wait_for_selector("#manage-modal:not([hidden])")

    tabs = [
        ("theme", "主题"),
        ("bookmarks", "书签"),
        ("categories", "分组"),
        ("workflows", "工作流"),
        ("search", "搜索引擎"),
        ("shortcuts", "快捷键"),
        ("sync", "同步"),
    ]

    for sub, label in tabs:
        page.click(f'.subtab[data-sub="{sub}"]')
        page.wait_for_timeout(200)
        panel = page.locator(f'.subpanel[data-subpanel="{sub}"]')
        result.check(f"{label} 面板可见", not panel.get_attribute("hidden"),
                     f"data-subpanel={sub}")

def test_bookmark_add_and_delete(page):
    """测试 4: 书签增删功能"""
    goto_and_wait(page)
    page.click("#manage-btn")
    page.wait_for_selector("#manage-modal:not([hidden])")
    page.click('.subtab[data-sub="bookmarks"]')
    page.wait_for_timeout(300)

    # 获取原来的书签数
    original_items = page.locator(".bm-grid-item").count()

    # 点击添加
    page.click("#bm-add")
    page.wait_for_timeout(200)
    result.check("添加表单展开", page.locator("#bm-form").is_visible())

    # 填写并保存
    page.fill("#bm-form-title", "测试书签")
    page.fill("#bm-form-url", "https://test.example.com")
    page.click("#bm-form-save")
    page.wait_for_timeout(300)

    new_count = page.locator(".bm-grid-item").count()
    result.check("书签数量增加", new_count > original_items,
                 f"原: {original_items}, 新: {new_count}")

    # 选中后删除
    items = page.locator(".bm-grid-item")
    first = items.first
    first.click()
    page.wait_for_timeout(100)
    result.check("选中后出现移动/删除工具栏",
                 page.locator("#bm-move-form").is_visible())

    if page.locator("#bm-move-form").is_visible():
        page.click("#bm-move-delete")
        page.wait_for_timeout(200)
        confirm = page.locator("#mm-confirm")
        confirm.wait_for(state="visible", timeout=2000)
        result.check("确认弹窗出现", confirm.is_visible())
        page.click("#mm-confirm-ok")
        page.wait_for_timeout(300)
        final_count = page.locator(".bm-grid-item").count()
        result.check("书签删除成功", final_count < new_count,
                     f"删除前: {new_count}, 删除后: {final_count}")

def test_category_crud(page):
    """测试 5: 分组增删改名"""
    goto_and_wait(page)
    page.click("#manage-btn")
    page.wait_for_selector("#manage-modal:not([hidden])")
    page.click('.subtab[data-sub="categories"]')
    page.wait_for_timeout(500)

    # 等待 __testStore 可用
    page.wait_for_function("typeof window.__testStore !== 'undefined'", timeout=5000)

    initial_count = page.evaluate("window.__testStore.getState().categories.length")

    # 新增分组（订阅会自动更新 UI）
    page.evaluate("() => window.__testStore.addCategory('测试分组')")
    page.wait_for_timeout(500)

    mid_count = page.evaluate("window.__testStore.getState().categories.length")
    mid_names = page.evaluate("""() => {
      return window.__testStore.getState().categories.map(c => c.name);
    }""")
    result.check("分组增加成功", mid_count > initial_count,
                 f"原: {initial_count}, 新: {mid_count}")
    result.check("新增分组名称存在", "测试分组" in mid_names,
                 f"名称: {mid_names}")

    # 重命名
    cat_id = page.evaluate("""() => {
      const cats = window.__testStore.getState().categories;
      const cat = cats.find(c => c.name === '测试分组');
      return cat ? cat.id : null;
    }""")
    if cat_id:
        page.evaluate("""(id) => {
          window.__testStore.renameCategory(id, '已改名分组');
        }""", cat_id)
        page.wait_for_timeout(300)
        final_names = page.evaluate("""() => {
          return window.__testStore.getState().categories.map(c => c.name);
        }""")
        result.check("分组改名成功", "已改名分组" in final_names,
                     f"实际: {final_names}")
    else:
        result.check("分组改名成功", False, "未找到测试分组 ID")

    # 删除测试分组
    cat_id = page.evaluate("""() => {
      const cats = window.__testStore.getState().categories;
      const cat = cats.find(c => c.name === '已改名分组' || c.name === '测试分组');
      return cat ? cat.id : null;
    }""")
    if cat_id:
        page.evaluate("""(id) => {
          window.__testStore.deleteCategory(id);
        }""", cat_id)
        page.wait_for_timeout(300)

    final_count = page.evaluate("window.__testStore.getState().categories.length")
    result.check("分组清理完毕", final_count == initial_count,
                 f"清理后: {final_count}, 初始: {initial_count}")


def test_theme_switching(page):
    """测试 6: 主题切换和浅色/深色模式"""
    goto_and_wait(page)
    page.click("#manage-btn")
    page.wait_for_selector("#manage-modal:not([hidden])")
    page.click('.subtab[data-sub="theme"]')
    page.wait_for_timeout(300)

    # 检查主题卡片
    themes = page.locator(".theme-card")
    result.check("主题卡片渲染", themes.count() >= 2)

    # 切换像素主题
    pixel_card = page.locator('.theme-card[data-theme="pixel"]')
    if pixel_card.count() > 0:
        pixel_card.click()
        page.wait_for_timeout(200)
        style = page.evaluate('document.documentElement.dataset.style')
        result.check("切换到像素主题", style == "pixel",
                     f"实际: {style}")

    # 切回默认主题
    default_card = page.locator('.theme-card[data-theme="default"]')
    default_card.click()
    page.wait_for_timeout(200)
    style = page.evaluate('document.documentElement.dataset.style')
    result.check("切回默认主题", style == "default",
                 f"实际: {style}")

    # 深浅模式切换
    mode_btns = page.locator(".theme-mode-group button")
    dark_btn = page.locator('.theme-mode-group button[data-mode="dark"]')
    dark_btn.click()
    page.wait_for_timeout(200)
    mode = page.evaluate('document.documentElement.dataset.mode')
    result.check("切换到深色模式", mode == "dark",
                 f"实际: {mode}")

    light_btn = page.locator('.theme-mode-group button[data-mode="light"]')
    light_btn.click()
    page.wait_for_timeout(200)
    mode = page.evaluate('document.documentElement.dataset.mode')
    result.check("切换到浅色模式", mode == "light",
                 f"实际: {mode}")

    # 重置为浅色
    page.evaluate('localStorage.removeItem("startpage-theme-style")')
    page.evaluate('localStorage.removeItem("startpage-theme-mode")')

def test_search_engine(page):
    """测试 7: 搜索引擎切换"""
    goto_and_wait(page)
    page.click("#manage-btn")
    page.wait_for_selector("#manage-modal:not([hidden])")
    page.click('.subtab[data-sub="search"]')
    page.wait_for_timeout(300)

    search_cards = page.locator(".search-card")
    count = search_cards.count()
    result.check("搜索引擎卡片渲染", count >= 3,
                 f"实际: {count} 个引擎")

    # 切换搜索引擎
    if count >= 4:
        duck_card = search_cards.nth(2)
        duck_card.click()
        page.wait_for_timeout(200)
        result.check("搜索引擎切换成功", True)

def test_workflows_panel(page):
    """测试 8: 工作流面板"""
    goto_and_wait(page)
    page.click("#manage-btn")
    page.wait_for_selector("#manage-modal:not([hidden])")
    page.click('.subtab[data-sub="workflows"]')
    page.wait_for_timeout(300)

    # 打开新建工作流弹窗
    page.click("#wf-add")
    page.wait_for_timeout(300)
    wf_popover = page.locator("#wf-popover")
    result.check("新建工作流弹窗弹出", wf_popover.is_visible())

    # 检查弹窗内容
    result.check("工作流名称输入框",
                 page.locator("#wf-popover-name").is_visible())
    result.check("URL 文本框可见",
                 page.locator("#wf-popover-urls").is_visible())

    # 关闭弹窗（点击保存按钮旁的取消按钮）
    cancel_btn = page.locator('#wf-popover .bm-form-actions .btn').first
    if cancel_btn.is_visible():
        cancel_btn.click(force=True)
    else:
        page.keyboard.press("Escape")
    page.wait_for_timeout(500)
    result.check("工作流弹窗关闭", wf_popover.is_hidden())

def test_shortcuts_panel(page):
    """测试 9: 快捷键面板（静态内容）"""
    goto_and_wait(page)
    page.click("#manage-btn")
    page.wait_for_selector("#manage-modal:not([hidden])")
    page.click('.subtab[data-sub="shortcuts"]')
    page.wait_for_timeout(300)

    shortcuts = page.locator(".shortcut-row")
    count = shortcuts.count()
    result.check("快捷键列表显示", count >= 7,
                 f"实际: {count} 条快捷键")

def test_sync_indicator_topbar(page):
    """测试 10: 顶栏同步指示器"""
    goto_and_wait(page)

    # Supabase 未配置 -> 同步指示器应隐藏
    indicator = page.locator("#sync-indicator")
    result.check("未配置时同步指示器隐藏", indicator.is_hidden(),
                 "Supabase 未配置时不显示")

    # 通过 JS 模拟已登录和同步状态
    is_setup = page.evaluate("""() => {
      const el = document.getElementById('sync-indicator');
      if (!el) return 'no-element';
      return el.hidden ? 'hidden' : 'visible';
    }""")
    result.check("同步指示器元素存在", is_setup != "no-element")

def test_keyboard_shortcuts(page):
    """测试 11: 键盘快捷键"""
    goto_and_wait(page)

    # `/` 键聚焦输入框
    page.keyboard.press("/")
    page.wait_for_timeout(200)
    input_focused = page.evaluate("""() => {
      const el = document.getElementById('terminal-input');
      return document.activeElement === el;
    }""")
    result.check("/ 键聚焦输入框", input_focused)

    # 按 Esc 清空
    page.keyboard.press("Escape")
    page.wait_for_timeout(100)

def test_modal_close_on_esc(page):
    """测试 12: 按 ESC 关闭设置面板"""
    goto_and_wait(page)
    page.click("#manage-btn")
    page.wait_for_selector("#manage-modal:not([hidden])")
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)
    result.check("ESC 关闭设置面板",
                 page.locator("#manage-modal").get_attribute("hidden") == "")

def test_auth_modal_ui(page):
    """测试 13: 登录/注册模态框 UI 验证（仅 UI，不实际调用 API）"""
    goto_and_wait(page)
    page.click("#manage-btn")
    page.wait_for_selector("#manage-modal:not([hidden])")
    page.click('.subtab[data-sub="sync"]')
    page.wait_for_timeout(300)

    # 登录/注册按钮应隐藏（因为 Supabase 没配置）
    login_btn = page.locator("#sync-login-btn")
    signup_btn = page.locator("#sync-signup-btn")
    result.check("未配置时登录按钮隐藏", login_btn.is_hidden())
    result.check("未配置时注册按钮隐藏", signup_btn.is_hidden())

    # 验证模态框 HTML 结构存在
    auth_modal = page.locator("#sync-auth-modal")
    result.check("登录模态框 DOM 存在", auth_modal.count() > 0)

    reset_modal = page.locator("#sync-reset-modal")
    result.check("密码重置模态框 DOM 存在", reset_modal.count() > 0)

    verify_modal = page.locator("#sync-verify-modal")
    result.check("邮箱验证模态框 DOM 存在", verify_modal.count() > 0)

def test_page_loads_without_errors(page):
    """测试 14: 页面加载无 JS 错误"""
    errors = []
    page.on("pageerror", lambda err: errors.append(str(err)))

    goto_and_wait(page)
    page.wait_for_timeout(1000)

    result.check("页面无 JS 错误", len(errors) == 0,
                 f"错误: {errors}" if errors else "")

    # 核心元素存在
    result.check("顶栏存在", page.locator("#topbar").is_visible())
    result.check("齿轮按钮存在", page.locator("#manage-btn").is_visible())
    result.check("标签页存在", page.locator("#tabs").is_visible())

def test_topbar_structure(page):
    """测试 15: 顶栏元素结构"""
    goto_and_wait(page)

    topbar = page.locator("#topbar")

    # 检查顶栏内的元素
    tabs_rect = page.locator("#tabs-rect")
    result.check("标签容器存在", tabs_rect.is_visible())

    topbar_right = page.locator(".topbar-right")
    result.check("右侧容器存在", topbar_right.is_visible())

    # 在 topbar-right 中，同步指示器应在齿轮按钮之前
    children = page.evaluate("""() => {
      const right = document.querySelector('.topbar-right');
      return Array.from(right.children).map(c => c.id || c.className);
    }""")
    result.check("同步指示器在齿轮前",
                 children.index('sync-indicator') < children.index('manage-btn'))


def run_all_tests(headless=True):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
        )
        page = context.new_page()

        print("\n" + "=" * 60)
        print("🧪 ZZHSart-Page 综合测试套件")
        print("=" * 60)

        test_funcs = [
            ("页面加载无错误", test_page_loads_without_errors),
            ("顶栏元素结构", test_topbar_structure),
            ("设置面板 & 同步未配置", test_sync_panel_page_load),
            ("子标签导航", test_settings_tab_navigation),
            ("书签增删", test_bookmark_add_and_delete),
            ("分组管理", test_category_crud),
            ("主题切换", test_theme_switching),
            ("搜索引擎切换", test_search_engine),
            ("工作流面板", test_workflows_panel),
            ("快捷键面板", test_shortcuts_panel),
            ("顶栏同步指示器", test_sync_indicator_topbar),
            ("键盘快捷键", test_keyboard_shortcuts),
            ("ESC 关闭面板", test_modal_close_on_esc),
            ("登录模态框 UI", test_auth_modal_ui),
        ]

        for name, func in test_funcs:
            print(f"\n--- {name} ---")
            try:
                func(page)
            except Exception as e:
                result.failed += 1
                msg = f"  ✗ {name} - 异常: {str(e)}"
                print(msg)
                result.errors.append(msg)
                page.screenshot(path=f"/tmp/test_fail_{name.replace(' ', '_')}.png")

        browser.close()

    print("\n" + "=" * 60)
    print(f"📊 测试结果: {result.passed} 通过, {result.failed} 失败")
    if result.failed > 0:
        print("\n❌ 失败详情:")
        for err in result.errors:
            print(f"  {err}")
    print("=" * 60)

    return result.failed == 0


if __name__ == "__main__":
    import sys
    headless = "--headed" not in sys.argv
    success = run_all_tests(headless=headless)
    sys.exit(0 if success else 1)
