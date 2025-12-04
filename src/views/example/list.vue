<template>
  <div class="app-container">
      阅读情况:
    <el-radio-group v-model="switchRoles">
      <el-radio-button label="全部公告" value="all"/>
      <el-radio-button label="未读" value="not"/>
      <el-radio-button label="已读" value="yes"/>
    </el-radio-group>
    <el-table v-loading="listLoading" :data="list" border fit highlight-current-row style="width: 100%;">
      <el-table-column align="center" label="序号" width="80">
        <template slot-scope="scope">
          <span>{{ scope.row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column width="120px" align="center" label="发布人">
        <template slot-scope="scope">
          <span>{{ scope.row.author }}</span>
        </template>
      </el-table-column>
      <el-table-column min-width="300px" label="标题">
        <template slot-scope="{row}">
          <router-link :to="'/example/edit/'+row.id" class="link-type">
            <span :style="{ color: getColorByIndex(row.importance) }">{{ row.title }}</span>
          </router-link>
        </template>
      </el-table-column>
      <el-table-column width="100px" label="重要程度">
        <template slot-scope="scope">
          <svg-icon v-for="n in +scope.row.importance" :key="n" icon-class="star" class="meta-item__icon" :style="{ color: getColorByIndex(scope.row.importance) }"/>
        </template>
      </el-table-column>

      <el-table-column class-name="status-col" label="阅读状态" width="110">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusFilter">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column width="180px" align="center" label="发布时间">
        <template slot-scope="scope">
          <span>{{ scope.row.timestamp | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>

      <el-table-column align="center" label="操作" width="140">
        <template slot-scope="scope">
          <!--<router-link :to="'/example/edit/'+scope.row.id">-->
            <el-button type="primary" size="small" icon="el-icon-edit" @click="setIsRead(scope.row.id)">
              设为已读
            </el-button>
          <!--</router-link>-->
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList"/>
  </div>
</template>

<script>
import { fetchList } from '@/api/article'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination

export default {
  name: 'ArticleList',
  components: { Pagination },
  filters: {
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'info',
        deleted: 'danger'
      }
      return statusMap[status]
    }
  },
  data() {
    return {
      list: [{"id":1,"timestamp": 172354124,"author":"ass", "importance":2, "status": "未读", "title": "关于上线翔迅内网管控软件的通知", "range":"全体部门"}],
      total: 0,
      listLoading: true,
      switchRoles: "not",
      listQuery: {
        page: 1,
        limit: 20
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getColorByIndex(index) {
      const colors = ['gray', '#409EFF', 'red'];
      return colors[index - 1] || 'gray'; // 根据索引选择颜色
    },
    getList() {
      this.listLoading = true
      //fetchList(this.listQuery).then(response => {
      //  this.list = response.data.items
      //  this.total = response.data.total
      //  this.listLoading = false
      //})
      this.list = [
        {"id":1,"timestamp": 1743241240,"author":"ass", "importance":3, "status": "未读", "title": "关于上线翔迅内网管控软件的通知", "range":"全体部门"},
        {"id":2,"timestamp": 1743541240,"author":"ass", "importance":1, "status": "未读", "title": "关于上线翔迅内网管控软件的通知", "range":"全体部门"},
        {"id":3,"timestamp": 1743941240,"author":"ass", "importance":2, "status": "未读", "title": "关于上线翔迅内网管控软件的通知", "range":"全体部门"},
        {"id":4,"timestamp": 1744541240,"author":"ass", "importance":2, "status": "未读", "title": "关于上线翔迅内网管控软件的通知", "range":"全体部门"},
        {"id":5,"timestamp": 1752241240,"author":"ass", "importance":3, "status": "未读", "title": "关于上线翔迅内网管控软件的通知", "range":"全体部门"},
      ]
      this.total = 20
      this.listLoading = false
    },
    setIsRead(index){
      this.list[index - 1]["status"] = "已读"
    }
  }
}
</script>

<style scoped>
.edit-input {
  padding-right: 100px;
}
.cancel-btn {
  position: absolute;
  right: 15px;
  top: 10px;
}
</style>
