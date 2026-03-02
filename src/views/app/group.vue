<template>
    <div class="group-manage">
        <v-table ref="table" :load="loadList">
            <template #cell="{ value, field }">
                <el-tag v-if="field === 'active'" :type="value ? 'success' : 'info'">
                    {{ value ? '启用' : '禁用' }}
                </el-tag>
                <el-tag v-if="field === 'sleep_time'" type="info">
                    {{ value }}
                </el-tag>
            </template>
            <template #operations="{ row }">
                <el-link :underline="false" type="primary" @click="showFunctionManage(row)">功能管理</el-link>
                <el-link :underline="false" type="warning" v-if="row.active" @click="disableGroup(row)">禁用</el-link>
                <el-link :underline="false" type="success" v-else @click="enableGroup(row)">启用</el-link>
            </template>
        </v-table>

        <v-form-dialog title="功能管理" :form="functionForm" ref="functionDialog" width="740px">
            <el-form-item label="群号">
                <span>{{ functionForm.group_id }}</span>
            </el-form-item>
            <el-form-item label="功能列表">
                <el-table :data="functionForm.function_list" stripe>
                    <el-table-column prop="name" label="插件名称" width="250"/>
                    <el-table-column prop="plugin_id" label="插件ID" width="250"/>
                    <el-table-column prop="disabled" label="启用" width="60">
                        <template #default="scope">
                            <el-switch v-model="scope.row.disabled" :active-value="false" :inactive-value="true" @change="updateFunctionStatus(scope.row)"/>
                        </template>
                    </el-table-column>
                </el-table>
            </el-form-item>
        </v-form-dialog>
    </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import { getGroupActiveList, setGroupActive, getGroupFunctionList, setFunctionActive } from '@/request/group'
import Common, { StringDict } from '@/lib/common'

import VTable from '@/components/table/v-table.vue'
import VFormDialog from '@/components/v-form-dialog.vue'

@Options({
    components: {
        VTable,
        VFormDialog
    },
    computed: {
        table () {
            return this.$refs.table
        },
        functionDialog () {
            return this.$refs.functionDialog
        }
    },
    mounted () {
        this.table.setColumns({
            group_id: '群号',
            active: '状态',
            sleep_time: '禁用时间'
        })
    }
})
export default class Group extends Vue {
    table!: VTable
    functionDialog!: VFormDialog

    public form = {}
    public functionForm = {
        group_id: '',
        function_list: [] as any[]
    }

    public async loadList () {
        const res = await getGroupActiveList({})
        if (res) {
            // 处理API返回的数据，确保是数组格式
            let data = res.data
            if (data && !Array.isArray(data)) {
                // 如果返回的是单个对象，将其转换为数组
                data = [data]
            }

            // 将sleep_time从时间戳转换为可读日期
            data = data.map((item: any) => ({
                ...item,
                sleep_time: this.formatTimestampToDate(item.sleep_time)
            }))

            this.table.setData(data)
        }
    }

    // 添加辅助函数将时间戳转换为日期
    public formatTimestampToDate (timestamp: any) {
        if (timestamp == null || timestamp === undefined || timestamp === '') {
            return '未禁用'
        }

        const ts = Number(timestamp)
        if (ts <= 0) {
            return '未禁用'
        }

        // 如果时间戳是秒单位
        const date = new Date(ts * 1000)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }

    public async enableGroup (item: StringDict) {
        const res = await setGroupActive({
            group_id: item.group_id,
            active: true
        })
        if (res) {
            await this.table.executeLoad()
        }
    }

    public async disableGroup (item: StringDict) {
        const res = await setGroupActive({
            group_id: item.group_id,
            active: false
        })
        if (res) {
            await this.table.executeLoad()
        }
    }

    public async showFunctionManage (item: StringDict) {
        this.functionForm.group_id = item.group_id
        this.functionForm.function_list = []

        const res = await getGroupFunctionList({ group_id: Number(item.group_id) })
        if (res) {
            const data = res.data
            if (data && data['0']) {
                // 根据API文档，功能列表存储在以数字为键的对象中
                this.functionForm.function_list = Object.keys(data)
                    .filter(key => key !== 'group_id') // 排除group_id字段
                    .map(key => data[key])
            } else if (Array.isArray(data)) {
                // 如果返回的是数组格式
                this.functionForm.function_list = data
            } else if (data && typeof data === 'object') {
                // 尝试获取对象的所有值（排除group_id）
                this.functionForm.function_list = Object.entries(data)
                    .filter(([key, value]) =>
                        key !== 'group_id' &&
                        typeof value === 'object' &&
                        Object.prototype.hasOwnProperty.call(value, 'plugin_id')
                    )
                    .map(([key, value]) => value)
            }
            this.functionDialog.show()
        }
    }

    public async updateFunctionStatus (row: any) {
        const res = await setFunctionActive({
            group_id: this.functionForm.group_id,
            plugin_id: row.plugin_id,
            disabled: row.disabled
        })
        // 检查API响应格式
        if (res && ((res.status !== undefined && res.status) || (res.data && res.data.status))) {
            this.$message.success('更新成功')
        } else {
            this.$message.error('更新失败')
        }
    }
}
</script>

<style lang="scss">
.group-manage {
    .el-select {
        width: 100%;
    }
}
</style>
