<template>
  <div class="menu-config-simple">
    <!-- 头部操作栏 -->
    <div class="config-header">
      <div class="header-left">
        <h2><i class="el-icon-setting"></i> 菜单配置管理</h2>
        <p class="header-desc">配置左侧导航菜单结构，配置后立即生效</p>
      </div>
      <div class="header-actions">
        <el-button
          type="primary"
          icon="el-icon-download"
          @click="exportConfig"
          size="small"
        >
          导出配置
        </el-button>
        <el-button
          type="success"
          icon="el-icon-upload"
          @click="showImport = true"
          size="small"
        >
          导入配置
        </el-button>
        <el-button
          type="warning"
          icon="el-icon-refresh"
          @click="resetToDefault"
          size="small"
        >
          重置
        </el-button>
        <el-button
          type="primary"
          icon="el-icon-check"
          @click="saveConfig"
          :loading="saving"
          :disabled="!scriptUploadSuccess"
          size="small"
        >
          保存配置
        </el-button>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="config-main">
      <!-- 左侧：菜单树 -->
      <div class="left-section" :style="{ width: leftWidth + 'px' }">
        <el-card shadow="never">
          <div slot="header" class="section-header">
            <span>菜单结构</span>
            <div class="section-actions">
              <el-button
                type="text"
                icon="el-icon-plus"
                @click="addGroup"
                size="mini"
              >
                添加分组
              </el-button>
              <el-button
                type="text"
                icon="el-icon-sort"
                @click="toggleExpand"
                size="mini"
              >
                {{ isExpanded ? '收起全部' : '展开全部' }}
              </el-button>
            </div>
          </div>

          <div class="tree-container">
            <el-input
              v-model="searchText"
              placeholder="搜索菜单..."
              prefix-icon="el-icon-search"
              size="small"
              clearable
              style="margin-bottom: 10px;"
            />

            <el-tree
              ref="menuTree"
              :data="menuData"
              node-key="id"
              default-expand-all
              :expand-on-click-node="false"
              :filter-node-method="filterNode"
              draggable
              @node-click="handleNodeClick"
              @node-drop="handleDrop"
            >
              <div class="tree-node" slot-scope="{ node, data }">
                <div class="node-content">
                  <i :class="getNodeIcon(data.type)" class="node-icon"></i>
                  <span class="node-label">{{ data.name }}</span>
                  <el-tag
                    v-if="data.type === 'script'"
                    size="mini"
                    type="info"
                    class="script-tag"
                  >
                    脚本
                  </el-tag>
                </div>
                <div class="node-actions">
                  <el-button
                    v-if="data.type !== 'script'"
                    type="text"
                    icon="el-icon-plus"
                    @click.stop="addChild(node, data)"
                    size="mini"
                    title="添加子项"
                  />
                  <el-button
                    type="text"
                    icon="el-icon-edit"
                    @click.stop="editNode(data)"
                    size="mini"
                    title="编辑"
                  />
                  <el-button
                    type="text"
                    icon="el-icon-delete"
                    @click.stop="deleteNode(node, data)"
                    size="mini"
                    title="删除"
                    style="color: #F56C6C;"
                  />
                </div>
              </div>
            </el-tree>
          </div>

          <div class="tree-stats">
            <el-row :gutter="10">
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">分组</div>
                  <div class="stat-value">{{ stats.groups }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">菜单</div>
                  <div class="stat-value">{{ stats.menus }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">脚本</div>
                  <div class="stat-value">{{ stats.scripts }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">总计</div>
                  <div class="stat-value">{{ stats.total }}</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </div>

      <!-- 可拖动分隔条 -->
      <div class="splitter" @mousedown="startDrag" @touchstart.prevent="startDragTouch"></div>

      <!-- 右侧：配置表单 -->
      <div class="right-section">
        <el-card shadow="never">
          <div slot="header" class="section-header">
            <span>节点配置</span>
            <div class="node-status" v-if="currentNode">
              <el-tag size="small" :type="getNodeTypeTag(currentNode.type)">
                {{ getNodeTypeName(currentNode.type) }}
              </el-tag>
            </div>
          </div>

          <div class="form-container" v-if="currentNode">
            <el-form
              :model="currentNode"
              :rules="formRules"
              ref="configForm"
              label-width="80px"
              size="small"
            >
              <!-- 基础信息 -->
              <el-form-item label="名称" prop="name">
                <el-input
                  v-model="currentNode.name"
                  placeholder="请输入名称"
                  maxlength="20"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item label="类型" prop="type">
                <el-radio-group v-model="currentNode.type" @change="handleTypeChange">
                  <el-radio label="group">分组</el-radio>
                  <el-radio label="menu">菜单</el-radio>
                  <el-radio label="script">脚本</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="图标">
                <el-select
                  v-model="currentNode.icon"
                  placeholder="选择图标"
                  style="width: 100%;"
                >
                  <el-option-group label="常用图标">
                    <el-option
                      v-for="icon in iconOptions"
                      :key="icon.value"
                      :label="icon.label"
                      :value="icon.value"
                    >
                      <span style="float: left">
                        <i :class="icon.value"></i>
                      </span>
                      <span style="float: right; color: #8492a6; font-size: 13px">
                        {{ icon.label }}
                      </span>
                    </el-option>
                  </el-option-group>
                </el-select>
              </el-form-item>

              <!-- 脚本特有配置 -->
              <template v-if="currentNode.type === 'script'">
                <el-form-item label="脚本文件">
                  <el-input
                    v-model="currentNode.scriptFile"
                    placeholder="脚本文件路径，如: scripts/test.js"
                  >
                    <el-button
                      slot="append"
                      icon="el-icon-folder"
                      @click="browseScript"
                    />
                  </el-input>
                </el-form-item>

                <el-form-item label="描述">
                  <el-input
                    v-model="currentNode.description"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入脚本描述"
                    maxlength="100"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item label="参数">
                  <div class="params-container">
                    <div v-for="(param, index) in currentNode.params" :key="index" class="param-item">
                      <el-input
                        v-model="param.name"
                        placeholder="参数名"
                        size="mini"
                        style="width: 120px; margin-right: 5px;"
                      />
                      <el-input
                        v-model="param.defaultValue"
                        placeholder="默认值"
                        size="mini"
                        style="width: 120px; margin-right: 5px;"
                      />
                      <el-button
                        type="text"
                        icon="el-icon-delete"
                        @click="removeParam(index)"
                        size="mini"
                        style="color: #F56C6C;"
                      />
                    </div>
                    <el-button
                      type="text"
                      icon="el-icon-plus"
                      @click="addParam"
                      size="mini"
                    >
                      添加参数
                    </el-button>
                  </div>
                </el-form-item>
              </template>

              <!-- 通用配置 -->
              <el-form-item label="顺序">
                <el-input-number
                  v-model="currentNode.order"
                  :min="1"
                  :max="100"
                  controls-position="right"
                  style="width: 100px;"
                />
              </el-form-item>

              <el-form-item label="状态">
                <el-switch
                  v-model="currentNode.enabled"
                  active-text="启用"
                  inactive-text="禁用"
                  active-color="#13ce66"
                  inactive-color="#ff4949"
                />
              </el-form-item>
            </el-form>
          </div>

          <div v-else class="no-selection">
            <div class="empty-tip">
              <i class="el-icon-info" style="font-size: 48px; color: #C0C4CC;"></i>
              <p>请选择一个节点进行配置</p>
              <small>或点击左侧的"添加分组"按钮</small>
            </div>
          </div>
        </el-card>

        <!-- 预览 -->
        <el-card shadow="never" class="preview-card">
          <div slot="header" class="section-header">
            <span>预览</span>
            <el-button
              type="text"
              icon="el-icon-view"
              @click="refreshPreview"
              size="mini"
            >
              刷新
            </el-button>
          </div>
          <div class="preview-content">
            <div class="preview-tree">
              <div v-for="group in menuData" :key="group.id" class="preview-group">
                <div class="preview-group-title">
                  <i :class="group.icon || 'el-icon-folder'"></i>
                  {{ group.name }}
                  <el-tag size="mini" v-if="!group.enabled" type="info">禁用</el-tag>
                </div>
                <div v-if="group.children" class="preview-children">
                  <div v-for="menu in group.children" :key="menu.id" class="preview-menu">
                    <div class="preview-menu-title">
                      <i :class="menu.icon || 'el-icon-folder-opened'"></i>
                      {{ menu.name }}
                    </div>
                    <div v-if="menu.children" class="preview-scripts">
                      <div v-for="script in menu.children" :key="script.id" class="preview-script">
                        <i :class="script.icon || 'el-icon-document'"></i>
                        {{ script.name }}
                        <span class="script-file" v-if="script.scriptFile">
                          ({{ script.scriptFile }})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 导入对话框 -->
    <el-dialog
      title="导入配置"
      :visible.sync="showImport"
      width="400px"
    >
      <div class="import-content">
        <el-upload
          class="config-upload"
          drag
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileUpload"
          accept=".json"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">
            将JSON配置文件拖到此处<br/>
            或 <em>点击上传</em>
          </div>
        </el-upload>
        <div class="import-tips">
          <p><i class="el-icon-warning"></i> 导入会覆盖当前配置</p>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showImport = false">取消</el-button>
        <el-button type="primary" @click="confirmImport">确定导入</el-button>
      </span>
    </el-dialog>

    <!-- 脚本上传/编辑对话框 -->
    <el-dialog
      title="上传/编辑脚本"
      :visible.sync="showScriptDialog"
      width="70%"
    >
      <div class="script-upload-dialog">
        <div class="script-dialog-tips">
          <p><i class="el-icon-info" /> 选择已上传脚本将直接绑定；上传新脚本需点确定</p>
        </div>
        <div style="margin-bottom: 10px; display:flex; align-items:center; gap:10px;">
          <el-button type="primary" size="mini" @click="$refs.scriptFileInput.click()">选择 .py 文件</el-button>
          <el-button type="success" :loading="loadingServerScripts" size="mini" @click="openServerScriptList">选择已上传脚本</el-button>
          <div style="color:#606266">{{ scriptFileName || '未选择文件' }}</div>
        </div>
        <input ref="scriptFileInput" type="file" accept=".py" style="display:none" @change="onScriptFileChange">

        <el-input v-model="scriptContent" type="textarea" :rows="18" placeholder="脚本内容将在此显示，可直接编辑后上传" />
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="showScriptDialog = false">取消</el-button>
        <el-button :loading="uploadingScript" :disabled="!scriptFileName && !scriptContent" type="primary" @click="uploadScriptToServer">上传</el-button>
        <el-button :disabled="!scriptUploadSuccess" type="success" @click="confirmScriptBinding">确定绑定</el-button>
      </span>
    </el-dialog>

    <!-- 服务器脚本列表对话框 -->
    <el-dialog
      title="选择已上传的脚本"
      :visible.sync="showServerScriptDialog"
      width="60%"
    >
      <el-table v-loading="loadingServerScripts" :data="serverScriptList" style="width: 100%">
        <el-table-column prop="name" label="脚本名称" width="200" />
        <el-table-column prop="path" label="脚本路径" show-overflow-tooltip />
        <el-table-column label="操作" width="120">
          <template slot-scope="scope">
            <el-button type="primary" size="mini" @click="selectServerScript(scope.row.path)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showServerScriptDialog = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { uploadScript, getScriptList } from '@/api/script'

export default {
  name: 'SimpleMenuConfig',

  data() {
    return {
      // 左侧宽度（像素），支持持久化
      leftWidth: Number(localStorage.getItem('menu_left_width')) || 300,
      dragging: false,
      dragStartX: 0,
      dragStartWidth: 0,

      // 菜单数据
      menuData: [],
      currentNode: null,
      originalData: null,

      // UI状态
      isExpanded: true,
      searchText: '',
      showImport: false,
      // 脚本上传/编辑对话框
      showScriptDialog: false,
      scriptFileName: '',
      scriptContent: '',
      scriptFileRaw: null,
      uploadingScript: false,
      scriptNodeRef: null,
      scriptUploadSuccess: false, // 标记脚本是否上传成功
      uploadedScriptPath: '', // 临时存储上传后的脚本路径
      hasUnsavedChanges: false, // 标记是否有未保存的配置
      showServerScriptDialog: false, // 服务器脚本列表对话框
      serverScriptList: [], // 服务器上的脚本列表
      loadingServerScripts: false,

      // 图标选项
      iconOptions: [
        { value: 'el-icon-s-data', label: '数据' },
        { value: 'el-icon-s-platform', label: '平台' },
        { value: 'el-icon-monitor', label: '监控' },
        { value: 'el-icon-cpu', label: 'CPU' },
        { value: 'el-icon-s-opportunity', label: '机会' },
        { value: 'el-icon-s-flag', label: '标记' },
        { value: 'el-icon-s-marketing', label: '营销' },
        { value: 'el-icon-s-operation', label: '操作' },
        { value: 'el-icon-s-promotion', label: '推广' },
        { value: 'el-icon-s-claim', label: '声明' },
        { value: 'el-icon-folder', label: '文件夹' },
        { value: 'el-icon-folder-opened', label: '打开文件夹' },
        { value: 'el-icon-document', label: '文档' },
        { value: 'el-icon-tickets', label: '票据' },
        { value: 'el-icon-collection', label: '收藏' }
      ],

      // 表单验证规则
      formRules: {
        name: [
          { required: true, message: '请输入名称', trigger: 'blur' },
          { min: 2, message: '至少2个字符', trigger: 'blur' }
        ],
        type: [
          { required: true, message: '请选择类型', trigger: 'change' }
        ]
      },

      // 默认数据
      defaultData: [
        {
          id: 'g1',
          name: 'P1 - 基础功能',
          type: 'group',
          icon: 'el-icon-s-data',
          order: 1,
          enabled: true,
          children: [
            {
              id: 'm1',
              name: '飞行状态监控',
              type: 'menu',
              icon: 'el-icon-monitor',
              order: 1,
              enabled: true,
              children: [
                {
                  id: 's1',
                  name: '状态监控脚本',
                  type: 'script',
                  icon: 'el-icon-s-promotion',
                  scriptFile: 'scripts/flight_status.py',
                  description: '监控飞行器的实时状态',
                  order: 1,
                  enabled: true,
                  params: [
                    { name: 'interval', defaultValue: '5' },
                    { name: 'timeout', defaultValue: '30' }
                  ]
                },
                {
                  id: 's2',
                  name: '发动机监控',
                  type: 'script',
                  icon: 'el-icon-fan',
                  scriptFile: 'scripts/engine_monitor.py',
                  description: '监控发动机运行状态',
                  order: 2,
                  enabled: true,
                  params: []
                }
              ]
            }
          ]
        },
        {
          id: 'g2',
          name: 'P2 - 通信测试',
          type: 'group',
          icon: 'el-icon-s-platform',
          order: 2,
          enabled: true,
          children: [
            {
              id: 'm2',
              name: '通信协议测试',
              type: 'menu',
              icon: 'el-icon-cpu',
              order: 1,
              enabled: true,
              children: [
                {
                  id: 's3',
                  name: 'TCP通信测试',
                  type: 'script',
                  icon: 'el-icon-s-operation',
                  scriptFile: 'scripts/tcp_test.py',
                  description: '测试TCP通信连接',
                  order: 1,
                  enabled: true,
                  params: [
                    { name: 'host', defaultValue: '127.0.0.1' },
                    { name: 'port', defaultValue: '8080' }
                  ]
                },
                {
                  id: 's4',
                  name: 'UDP通信测试',
                  type: 'script',
                  icon: 'el-icon-s-operation',
                  scriptFile: 'scripts/udp_test.py',
                  description: '测试UDP通信连接',
                  order: 2,
                  enabled: true,
                  params: []
                }
              ]
            }
          ]
        },
        {
          id: 'g3',
          name: 'P3 - 故障诊断',
          type: 'group',
          icon: 'el-icon-s-opportunity',
          order: 3,
          enabled: true,
          children: [
            {
              id: 'm3',
              name: '系统诊断',
              type: 'menu',
              icon: 'el-icon-s-flag',
              order: 1,
              enabled: true,
              children: [
                {
                  id: 's5',
                  name: '内存诊断',
                  type: 'script',
                  icon: 'el-icon-s-claim',
                  scriptFile: 'scripts/memory_diagnose.py',
                  description: '诊断系统内存使用情况',
                  order: 1,
                  enabled: true,
                  params: []
                },
                {
                  id: 's6',
                  name: 'CPU诊断',
                  type: 'script',
                  icon: 'el-icon-s-marketing',
                  scriptFile: 'scripts/cpu_diagnose.py',
                  description: '诊断CPU使用情况',
                  order: 2,
                  enabled: true,
                  params: []
                }
              ]
            },
            {
              id: 'm4',
              name: '网络诊断',
              type: 'menu',
              icon: 'el-icon-s-custom',
              order: 2,
              enabled: true,
              children: [
                {
                  id: 's7',
                  name: '网络连通性',
                  type: 'script',
                  icon: 'el-icon-s-goods',
                  scriptFile: 'scripts/network_test.py',
                  description: '测试网络连通性',
                  order: 1,
                  enabled: true,
                  params: [
                    { name: 'target', defaultValue: '8.8.8.8' }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'g4',
          name: 'P4 - 性能测试',
          type: 'group',
          icon: 'el-icon-s-data',
          order: 4,
          enabled: true,
          children: [
            {
              id: 'm5',
              name: '负载测试',
              type: 'menu',
              icon: 'el-icon-s-order',
              order: 1,
              enabled: true,
              children: [
                {
                  id: 's8',
                  name: '压力测试脚本',
                  type: 'script',
                  icon: 'el-icon-s-comment',
                  scriptFile: 'scripts/stress_test.py',
                  description: '执行系统压力测试',
                  order: 1,
                  enabled: true,
                  params: [
                    { name: 'threads', defaultValue: '10' },
                    { name: 'duration', defaultValue: '60' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },

  computed: {
    // 统计信息
    stats() {
      const stats = { groups: 0, menus: 0, scripts: 0, total: 0 }

      const countNodes = (nodes) => {
        nodes.forEach(node => {
          stats[node.type + 's']++
          stats.total++
          if (node.children && node.children.length > 0) {
            countNodes(node.children)
          }
        })
      }

      countNodes(this.menuData)
      return stats
    }
  },

  watch: {
    searchText(val) {
      this.$refs.menuTree.filter(val)
    }
  },

  mounted() {
    this.loadConfig()
  },

  beforeDestroy() {
    // 移除事件监听，防止内存泄漏
    try {
      document.removeEventListener('mousemove', this.onDrag)
      document.removeEventListener('mouseup', this.stopDrag)
      document.removeEventListener('touchmove', this.onDragTouch)
      document.removeEventListener('touchend', this.stopDragTouch)
    } catch (e) {
      // ignore
    }
  },

  methods: {
    // 拖拽相关：开始（鼠标）
    startDrag(e) {
      this.dragging = true
      this.dragStartX = e.clientX
      this.dragStartWidth = this.leftWidth
      document.addEventListener('mousemove', this.onDrag)
      document.addEventListener('mouseup', this.stopDrag)
    },

    // 拖拽相关：移动（鼠标）
    onDrag(e) {
      if (!this.dragging) return
      const delta = e.clientX - this.dragStartX
      this.setLeftWidth(this.dragStartWidth + delta)
    },

    // 拖拽相关：停止（鼠标）
    stopDrag() {
      if (!this.dragging) return
      this.dragging = false
      document.removeEventListener('mousemove', this.onDrag)
      document.removeEventListener('mouseup', this.stopDrag)
      localStorage.setItem('menu_left_width', String(this.leftWidth))
    },

    // 触摸开始
    startDragTouch(e) {
      if (!e.touches || !e.touches[0]) return
      this.dragging = true
      this.dragStartX = e.touches[0].clientX
      this.dragStartWidth = this.leftWidth
      document.addEventListener('touchmove', this.onDragTouch, { passive: false })
      document.addEventListener('touchend', this.stopDragTouch)
    },

    // 触摸移动
    onDragTouch(e) {
      if (!this.dragging) return
      e.preventDefault()
      if (!e.touches || !e.touches[0]) return
      const delta = e.touches[0].clientX - this.dragStartX
      this.setLeftWidth(this.dragStartWidth + delta)
    },

    // 触摸结束
    stopDragTouch() {
      if (!this.dragging) return
      this.dragging = false
      document.removeEventListener('touchmove', this.onDragTouch)
      document.removeEventListener('touchend', this.stopDragTouch)
      localStorage.setItem('menu_left_width', String(this.leftWidth))
    },

    // 设置左侧宽度并做范围限制
    setLeftWidth(val) {
      const min = 200
      const max = Math.max(300, window.innerWidth - 300)
      let w = Math.round(val)
      if (w < min) w = min
      if (w > max) w = max
      this.leftWidth = w
    },
    // 加载配置
    loadConfig() {
      const saved = localStorage.getItem('script_menu_config')
      if (saved) {
        try {
          this.menuData = JSON.parse(saved)
        } catch (e) {
          console.error('加载配置失败:', e)
          this.resetToDefault()
        }
      } else {
        this.resetToDefault()
      }
      this.originalData = JSON.parse(JSON.stringify(this.menuData))
    },

    // 重置为默认配置
    resetToDefault() {
      this.$confirm('确定要重置为默认配置吗？当前配置将会丢失。', '提示', {
        type: 'warning'
      }).then(() => {
        this.menuData = JSON.parse(JSON.stringify(this.defaultData))
        this.currentNode = null
        this.$message.success('已重置为默认配置')
      })
    },

    // 保存配置
    saveConfig() {
      this.saving = true
      // 验证表单
      if (this.currentNode) {
        this.$refs.configForm.validate(valid => {
          if (valid) {
            this.doSave()
          } else {
            this.saving = false
            return false
          }
        })
      } else {
        this.doSave()
      }
    },

    doSave() {
      // 保存到本地存储
      localStorage.setItem('script_menu_config', JSON.stringify(this.menuData))

      // 更新原始数据
      this.originalData = JSON.parse(JSON.stringify(this.menuData))

      // 通知主页面更新
      window.dispatchEvent(new CustomEvent('menuConfigUpdated', {
        detail: this.menuData
      }))

      setTimeout(() => {
        this.saving = false
        this.$message.success('配置保存成功')
      }, 500)
    },

    // 导出配置
    exportConfig() {
      const dataStr = JSON.stringify(this.menuData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `menu_config_${new Date().getTime()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      this.$message.success('配置导出成功')
    },

    // 导入配置
    handleFileUpload(file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target.result)
          this.menuData = config
          this.currentNode = null
        } catch (error) {
          this.$message.error('配置文件格式错误')
        }
      }
      reader.readAsText(file.raw)
    },

    confirmImport() {
      this.showImport = false
      this.$message.success('配置导入成功')
    },

    // 树节点操作
    addGroup() {
      const newGroup = {
        id: 'group_' + Date.now(),
        name: '新分组',
        type: 'group',
        icon: 'el-icon-folder',
        order: this.menuData.length + 1,
        enabled: true,
        children: []
      }
      this.menuData.push(newGroup)
      this.editNode(newGroup)
    },

    addChild(node, data) {
      let childType = 'menu'
      if (data.type === 'menu') {
        childType = 'script'
      }

      const newChild = {
        id: `${childType}_${Date.now()}`,
        name: `新${childType === 'menu' ? '菜单' : '脚本'}`,
        type: childType,
        icon: this.getNodeIcon(childType),
        order: data.children ? data.children.length + 1 : 1,
        enabled: true
      }

      if (childType === 'script') {
        newChild.scriptFile = 'scripts/new_script.py'
        newChild.description = '新的脚本文件'
        newChild.params = []
      }

      if (!data.children) {
        this.$set(data, 'children', [])
      }
      data.children.push(newChild)

      // 展开父节点
      node.expanded = true
      this.editNode(newChild)
    },

    editNode(node) {
      // 如果当前有未保存的脚本上传，切换时提醒
      if (this.hasUnsavedChanges && this.currentNode && this.currentNode.type === 'script') {
        this.$confirm('当前脚本还未保存，是否继续切换？', '提示', {
          type: 'warning',
          confirmButtonText: '继续',
          cancelButtonText: '取消'
        }).then(() => {
          this.currentNode = node
          this.hasUnsavedChanges = false
          // 确保有params数组
          if (node.type === 'script' && !node.params) {
            this.$set(node, 'params', [])
          }
        }).catch(() => {
          // 取消切换
        })
      } else {
        this.currentNode = node
        // 确保有params数组
        if (node.type === 'script' && !node.params) {
          this.$set(node, 'params', [])
        }
      }
    },

    deleteNode(node, data) {
      this.$confirm('确定要删除这个节点吗？', '提示', {
        type: 'warning'
      }).then(() => {
        const parent = node.parent
        if (parent) {
          const children = parent.data.children || parent.data
          const index = children.findIndex(child => child.id === data.id)
          if (index > -1) {
            children.splice(index, 1)
          }
        } else {
          const index = this.menuData.findIndex(item => item.id === data.id)
          if (index > -1) {
            this.menuData.splice(index, 1)
          }
        }

        if (this.currentNode === data) {
          this.currentNode = null
        }

        this.$message.success('删除成功')
      })
    },

    // 树节点过滤
    filterNode(value, data) {
      if (!value) return true
      return data.name.toLowerCase().includes(value.toLowerCase())
    },

    // 节点点击
    handleNodeClick(data) {
      this.editNode(data)
    },

    // 拖拽处理
    handleDrop() {
      // 更新order
      this.updateOrders()
    },

    // 更新顺序
    updateOrders() {
      const updateNodeOrder = (nodes, baseOrder = 0) => {
        nodes.forEach((node, index) => {
          node.order = baseOrder + index + 1
          if (node.children) {
            updateNodeOrder(node.children)
          }
        })
      }
      updateNodeOrder(this.menuData)
    },

    // 切换展开/收起
    toggleExpand() {
      this.isExpanded = !this.isExpanded
      const tree = this.$refs.menuTree
      const nodes = tree.store._getAllNodes()
      nodes.forEach(node => {
        node.expanded = this.isExpanded
      })
    },

    // 获取节点图标
    getNodeIcon(type) {
      const icons = {
        group: 'el-icon-folder',
        menu: 'el-icon-folder-opened',
        script: 'el-icon-document'
      }
      return icons[type] || 'el-icon-question'
    },

    // 获取节点类型标签
    getNodeTypeTag(type) {
      const tags = {
        group: '',
        menu: 'success',
        script: 'info'
      }
      return tags[type] || ''
    },

    // 获取节点类型名称
    getNodeTypeName(type) {
      const names = {
        group: '分组',
        menu: '菜单',
        script: '脚本'
      }
      return names[type] || '未知'
    },

    // 类型变化处理
    handleTypeChange(type) {
      // 更新默认图标
      this.currentNode.icon = this.getNodeIcon(type)

      // 如果是脚本，初始化必要字段
      if (type === 'script') {
        if (!this.currentNode.scriptFile) {
          this.$set(this.currentNode, 'scriptFile', 'scripts/new_script.py')
        }
        if (!this.currentNode.description) {
          this.$set(this.currentNode, 'description', '脚本描述')
        }
        if (!this.currentNode.params) {
          this.$set(this.currentNode, 'params', [])
        }
      }
    },

    // 参数操作
    addParam() {
      if (!this.currentNode.params) {
        this.$set(this.currentNode, 'params', [])
      }
      this.currentNode.params.push({
        name: '',
        defaultValue: ''
      })
    },

    removeParam(index) {
      this.currentNode.params.splice(index, 1)
    },

    // 浏览脚本文件/打开上传对话框
    browseScript() {
      if (!this.currentNode) {
        this.$message.warning('请先选择一个脚本节点')
        return
      }
      this.scriptNodeRef = this.currentNode
      // 初始化对话框内容（保留原路径作为文件名提示）
      const path = this.currentNode.scriptFile || ''
      this.scriptFileName = path.split('/').pop() || ''
      this.scriptContent = ''
      this.scriptFileRaw = null
      this.showScriptDialog = true
    },

    // 处理本地选择的脚本文件
    onScriptFileChange(e) {
      const file = e.target.files && e.target.files[0]
      if (!file) return
      if (!file.name.endsWith('.py')) {
        this.$message.error('只能选择 .py 文件')
        return
      }
      this.scriptFileRaw = file
      this.scriptFileName = file.name
      const reader = new FileReader()
      reader.onload = (ev) => {
        this.scriptContent = ev.target.result
      }
      reader.readAsText(file)
    },

    // 将编辑内容或选择的文件上传到后端（只上传，不绑定）
    async uploadScriptToServer() {
      if (!this.scriptNodeRef) {
        this.$message.error('未绑定脚本节点')
        return
      }
      if (!this.scriptFileName && !this.scriptContent) {
        this.$message.warning('请选择或编辑要上传的脚本内容')
        return
      }
      this.uploadingScript = true
      try {
        let fileBlob = null
        const filename = this.scriptFileName || `script_${Date.now()}.py`
        if (this.scriptFileRaw) {
          fileBlob = this.scriptFileRaw
        } else {
          fileBlob = new Blob([this.scriptContent], { type: 'text/x-python' })
        }

        const formData = new FormData()
        formData.append('file', fileBlob, filename)
        // 可加上额外字段，如目标路径或 node id
        formData.append('nodeId', this.scriptNodeRef.id)

        const res = await uploadScript(formData)
        console.log('上传py文件结果为：', res)
        // 兼容不同后端返回结构：优先使用 savedPath，其次 path，再其次 url
        const uploadedPath = (res && res.data && res.data.savedPath) || (res && res.data && res.data.path) || (res && res.path) || (res && res.url)
        if (uploadedPath) {
          // 临时保存上传的脚本路径，等待确定后再绑定
          this.uploadedScriptPath = uploadedPath
          // 标记上传成功，启用确定按钮
          this.scriptUploadSuccess = true
          this.$message.success('脚本上传成功，点击确定绑定')
        } else {
          this.$message.warning('上传成功但无法获取文件路径，请手动输入')
        }
      } catch (err) {
        console.error(err)
        this.$message.error('上传失败，请查看控制台或后端日志')
      } finally {
        this.uploadingScript = false
      }
    },

    // 点击确定按钮绑定脚本
    confirmScriptBinding() {
      if (!this.scriptNodeRef) {
        this.$message.error('未绑定脚本节点')
        return
      }
      if (!this.uploadedScriptPath) {
        this.$message.warning('请先上传脚本文件')
        return
      }
      // 将上传的脚本路径绑定到当前节点
      this.scriptNodeRef.scriptFile = this.uploadedScriptPath
      this.hasUnsavedChanges = false
      this.$message.success('脚本已绑定')
      this.showScriptDialog = false
      // 重置状态
      this.scriptUploadSuccess = false
      this.uploadedScriptPath = ''
      this.scriptFileName = ''
      this.scriptContent = ''
      this.scriptFileRaw = null
    },

    // 打开服务器脚本列表对话框
    async openServerScriptList() {
      if (!this.currentNode || this.currentNode.type !== 'script') {
        this.$message.warning('请先选择一个脚本节点')
        return
      }
      this.loadingServerScripts = true
      try {
        const res = await getScriptList()
        this.serverScriptList = (res && res.data) || []
        this.showServerScriptDialog = true
      } catch (err) {
        console.error(err)
        this.$message.error('获取服务器脚本列表失败')
      } finally {
        this.loadingServerScripts = false
      }
    },

    // 从服务器列表选择脚本（直接绑定，不需要上传）
    selectServerScript(scriptPath) {
      if (this.currentNode) {
        this.currentNode.scriptFile = scriptPath
        this.$message.success('脚本已绑定')
        // 关闭两个对话框
        this.showServerScriptDialog = false
        this.showScriptDialog = false
        // 重置状态
        this.scriptUploadSuccess = false
        this.uploadedScriptPath = ''
        this.scriptFileName = ''
        this.scriptContent = ''
        this.scriptFileRaw = null
      }
    },

    // 刷新预览
    refreshPreview() {
      // 强制更新预览
      this.menuData = [...this.menuData]
      this.$message.success('预览已刷新')
    }
  }
}
</script>

<style scoped>
.menu-config-simple {
  height: 100vh;
  overflow: hidden;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.config-header {
  background: #fff;
  padding: 15px 20px;
  border-bottom: 1px solid #e6ebf5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-left h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-desc {
  margin: 5px 0 0 0;
  font-size: 12px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.config-main {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 15px;
  gap: 15px;
}

.left-section {
  /* 初始/最小宽度由 JS 控制并持久化到 localStorage */
  min-width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.splitter {
  width: 6px;
  cursor: col-resize;
  background: transparent;
  flex-shrink: 0;
  transition: background 0.15s;
}
.splitter:hover {
  background: rgba(0,0,0,0.04);
}

.right-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%;
  overflow: hidden;
}

.el-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0 !important;
  border-bottom: none !important;
}

.section-header span {
  font-weight: 500;
  font-size: 16px;
  color: #303133;
}

.section-actions {
  display: flex;
  gap: 5px;
}

.tree-container {
  flex: 1;
  overflow: hidden;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 5px 0;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.node-icon {
  width: 16px;
  color: #606266;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.script-tag {
  margin-left: 8px;
}

.node-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

.tree-stats {
  padding: 10px;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
}

.stat-item {
  text-align: center;
  padding: 5px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.form-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 5px;
}

.node-status {
  display: flex;
  align-items: center;
}

.params-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  background: #f5f7fa;
}

.param-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.param-item:last-child {
  margin-bottom: 0;
}

.no-selection {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.empty-tip {
  text-align: center;
}

.empty-tip p {
  margin: 10px 0 5px 0;
  font-size: 14px;
}

.empty-tip small {
  font-size: 12px;
  color: #c0c4cc;
}

.preview-card {
  flex: 1;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: #fafafa;
  border-radius: 4px;
}

.preview-group {
  margin-bottom: 15px;
  background: #fff;
  border-radius: 4px;
  padding: 10px;
  border: 1px solid #e6ebf5;
}

.preview-group-title {
  font-weight: 500;
  color: #409eff;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-children {
  margin-left: 20px;
}

.preview-menu {
  margin-bottom: 10px;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.preview-menu-title {
  font-weight: 500;
  color: #67c23a;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-scripts {
  margin-left: 15px;
}

.preview-script {
  padding: 5px 8px;
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
  border-left: 2px solid #e4e7ed;
  margin-bottom: 3px;
}

.preview-script:last-child {
  margin-bottom: 0;
}

.script-file {
  color: #909399;
  font-size: 11px;
  margin-left: 5px;
}

.import-content {
  padding: 20px;
}

.config-upload {
  text-align: center;
}

.import-tips {
  margin-top: 20px;
  padding: 10px;
  background: #f0f9ff;
  border-radius: 4px;
  font-size: 12px;
  color: #409eff;
}

.script-dialog-tips {
  margin-bottom: 15px;
  padding: 10px;
  background: #e6f7ff;
  border-left: 4px solid #1890ff;
  border-radius: 2px;
  font-size: 12px;
  color: #0050b3;
}

.script-dialog-tips i {
  margin-right: 5px;
}

.script-upload-dialog {
  margin-bottom: 10px;
}

/* 滚动条样式 */
.form-container::-webkit-scrollbar,
.preview-content::-webkit-scrollbar {
  width: 6px;
}

.form-container::-webkit-scrollbar-track,
.preview-content::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.form-container::-webkit-scrollbar-thumb,
.preview-content::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

@media (max-width: 992px) {
  .config-main {
    flex-direction: column;
  }

  .left-section {
    width: 100%;
    height: 300px;
  }

  .right-section {
    height: auto;
  }
}
</style>
