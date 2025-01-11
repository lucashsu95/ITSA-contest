<!DOCTYPE html>
<html lang="zh-Hant">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>產品管理系統</title>
  <link rel="stylesheet" href="./css/bootstrap.min.css" />
  <link rel="stylesheet" href="./css/team104.css" />
</head>

<body>


  <?php
  date_default_timezone_set('Asia/Taipei');
  @session_start();
  $db = new pdo('mysql:host=db;dbname=curd', 'root', '1234');
  $action = $_GET['action'] ?? 'show';

  if ($action == 'add') {
    $stmt = $db->prepare('INSERT INTO tbl_product (pro_name, pro_price, pro_details) VALUES (?, ?, ?)');
    $stmt->execute([$_POST['name'], $_POST['price'], $_POST['details']]);
    header('Location: ?action=show');
  }
  if ($action == 'delete') {
    $stmt = $db->prepare('DELETE FROM tbl_product WHERE pro_id = ?');
    $stmt->execute([$_GET['id']]);
    header('Location: ?action=show');
  }
  if ($action == 'update-from') {
    $stmt = $db->prepare('SELECT * FROM tbl_product WHERE pro_id = ?');
    $stmt->execute([$_GET['id']]);
    $data = $stmt->fetch();
  }
  if ($action == 'update') {
    $stmt = $db->prepare('UPDATE tbl_product SET pro_name = ?, pro_price = ?, pro_details = ? WHERE pro_id = ?');
    $stmt->execute([$_POST['name'], $_POST['price'], $_POST['details'], $_POST['id']]);
    header('Location: ?action=show');
  }
  if ($action == 'add_form') {
  }
  if ($action == 'show') {
    $query = $db->query('SELECT * FROM tbl_product');
    $data = $query->fetchAll();
  }
  ?>

  <div class="wrapper">
    <header>
      <div class="user-info">
        <span>ITSA，你好</span>
        <span>管理者</span>
        <button id="arrow">&lt;</button>
        <div class="drop-bar-wrapper">
          <div id="drop-bar">
            <div class="item">設置</div>
            <div class="item">我的帳戶</div>
            <div class="item">我的資訊</div>
            <div class="item">登出</div>
          </div>
        </div>
      </div>
    </header>
    <aside class="sidebar">
      <div class="accordion accordion-flush" id="accordionFlushExample">
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
              data-bs-target="#flush-collapseOne" aria-expanded="false" aria-controls="flush-collapseOne">
              ☰ 商品
            </button>
          </h2>
          <div id="flush-collapseOne" class="accordion-collapse collapse" data-bs-parent="#accordionFlushExample">
            <div class="accordion-body flex flex-column">
              <div class="mb-3">
                <a id="show-product" class="text-center my-3 nav-link py-2 custom-pointer" href="?action=show">檢視商品</a>
              </div>
              <div class="mb-3">
                <a id="add-product" class="text-center my-3 nav-link py-2 custom-pointer"
                  href="?action=add_form">新增商品</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
    <main class="content">
      <div id="content-area">

        <?php
        if ($action == 'add_form') {
          ?>
          <h2>商品表單</h2>
          <h3>新增商品資訊：</h3>
          <form action="?action=add" method="post">
            <div class="mb-3">
              <label for="name" class="form-label">商品名稱</label>
              <input type="text" class="form-control" id="name" name="name">
            </div>
            <div class="mb-3">
              <label for="price" class="form-label">商品價格</label>
              <input type="text" class="form-control" id="price" name="price">
            </div>
            <div class="mb-3">
              <label for="details" class="form-label">商品描述</label>
              <textarea class="form-control" id="details" name="details"></textarea>
            </div>

            <button type="submit" class="btn btn-primary">新增</button>
          </form>
          <?php
        }
        ?>
        <?php
        if ($action == 'show') {
          ?>
          <h2>商品表</h2>
          <h3>商品詳細資訊</h3>
          <table class="table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">名稱</th>
                <th scope="col">價格</th>
                <th scope="col">功能</th>
              </tr>
            </thead>
            <tbody>
              <?php
              foreach ($data as $row) {
                ?>
                <tr>
                  <th scope="row"><?php echo $row['pro_id']; ?></th>
                  <td><?php echo $row['pro_name']; ?></td>
                  <td><?php echo $row['pro_price']; ?></td>
                  <td>
                    <a href="?action=update-from&id=<?php echo $row['pro_id']; ?>">編輯</a>
                    ｜
                    <a href="?action=delete&id=<?php echo $row['pro_id']; ?>">刪除</a>
                  </td>
                </tr>
                <?php
              }
              ?>
            </tbody>
          </table>
          <?php
        }
        ?>
        <?php
        if ($action == 'update-from') {
          ?>
          <h2>商品表單</h2>
          <h3>編輯商品資訊：</h3>
          <form action="?action=update" method="post">
            <input type="hidden" name="id" value="<?php echo $data['pro_id']; ?>">
            <div class="mb-3">
              <label for="name" class="form-label">商品名稱</label>
              <input type="text" class="form-control" id="name" name="name" value="<?php echo $data['pro_name']; ?>">
            </div>
            <div class="mb-3">
              <label for="price" class="form-label">商品價格</label>
              <input type="text" class="form-control" id="price" name="price" value="<?php echo $data['pro_price']; ?>">
            </div>
            <div class="mb-3">
              <label for="details" class="form-label">商品描述</label>
              <textarea class="form-control" id="details" name="details"><?php echo $data['pro_details']; ?></textarea>
            </div>
            <button type="submit" class="btn btn-primary">更新</button>
          </form>
          <?php
        }
        ?>
      </div>
    </main>
    <footer>
      © 2025 ITSA 管理面板。保留所有權利，ITSA 2024設計
    </footer>
  </div>

  <script src="./js/bootstrap.min.js"></script>
  <script src="./js/team104.js"></script>
</body>

</html>