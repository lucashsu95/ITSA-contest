<?php
header('Content-Type: application/json; charset=utf-8');

$filename = 'weekly_kw.csv';
$data = [];

if (($handle = fopen($filename, 'r')) !== FALSE) {
    $header = fgetcsv($handle);

    while (($row = fgetcsv($handle)) !== FALSE) {
        $data[] = $row;
    }
    fclose($handle);
}

$result = [];

foreach ($data as $row) {
    $week = $row[0];
    $subData = [];

    if (!isset($result[$week])) {
        $result[$week] = [];
    }

    $subData['keyword'] = $row[1];
    $subData['count'] = intval($row[2]);
    $subData['avg_risk'] = floatval($row[3]);
    $subData['trend'] = $row[4];

    $result[$week][] = $subData;
}

// 對每週的關鍵字按count排序，並只保留TOP 10
foreach ($result as $week => $keywords) {
    // 按count降序排序
    usort($keywords, function ($a, $b) {
        return $b['count'] - $a['count'];
    });

    // 只保留前10名
    $result[$week] = array_slice($keywords, 0, 10);
}

echo json_encode($result, JSON_UNESCAPED_UNICODE);
