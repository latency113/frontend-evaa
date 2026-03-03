import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaTrash } from "react-icons/fa";

const MySwal = withReactContent(Swal);

interface User {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluateeId: string;
  evaluateeName: string;
}

export default function TabAssignment({ evaluationId }: { evaluationId: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [evaluators, setEvaluators] = useState<User[]>([]);
  const [evaluatees, setEvaluatees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedEvaluator, setSelectedEvaluator] = useState("");
  const [selectedEvaluatee, setSelectedEvaluatee] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assnRes, evalsRes, evaltsRes] = await Promise.all([
        api.get(`/assignments/evaluation/${evaluationId}`),
        api.get(`/users?role=EVALUATOR`),
        api.get(`/users?role=EVALUATEE`)
      ]);
      setAssignments(assnRes.data);
      setEvaluators(evalsRes.data);
      setEvaluatees(evaltsRes.data);
    } catch {
      console.error("Failed to fetch assignments data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [evaluationId]);

  const handleAdd = async () => {
    if (!selectedEvaluator || !selectedEvaluatee) {
      return MySwal.fire("แจ้งเตือน", "กรุณาเลือกผู้ประเมินและผู้รับการประเมิน", "warning");
    }

    if (selectedEvaluator === selectedEvaluatee) {
      return MySwal.fire("แจ้งเตือน", "ไม่สามารถเลือกผู้ประเมินและผู้รับการประเมินเป็นคนเดียวกันได้", "warning");
    }

    try {
      await api.post(`/assignments`, {
        evaluationId,
        evaluatorId: selectedEvaluator,
        evaluateeId: selectedEvaluatee
      });
      setSelectedEvaluator("");
      setSelectedEvaluatee("");
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || "เพิ่มคู่ประเมินไม่สำเร็จ";
      MySwal.fire("ข้อผิดพลาด", msg, "error");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await MySwal.fire({ title: "ลบคู่ประเมินนี้?", icon: "warning", showCancelButton: true });
    if (res.isConfirmed) {
      try {
        await api.delete(`/assignments/${id}`);
        fetchData();
      } catch {
        MySwal.fire("ข้อผิดพลาด", "ลบข้อมูลไม่สำเร็จ", "error");
      }
    }
  };

  if (loading) return <div>กำลังโหลด...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 border rounded-lg shadow-sm">
        <h4 className="text-lg font-semibold mb-4 text-gray-900">เพิ่มคู่ประเมิน</h4>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-gray-700">ผู้ประเมิน (Evaluator)</label>
            <select className="border-gray-300 rounded block w-full p-2.5 bg-gray-50 border text-gray-900" 
              value={selectedEvaluator} onChange={e => setSelectedEvaluator(e.target.value)}>
              <option value="">-- เลือกผู้ประเมิน --</option>
              {evaluators.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-gray-700">ผู้รับการประเมิน (Evaluatee)</label>
            <select className="border-gray-300 rounded block w-full p-2.5 bg-gray-50 border text-gray-900" 
              value={selectedEvaluatee} onChange={e => setSelectedEvaluatee(e.target.value)}>
              <option value="">-- เลือกผู้รับการประเมิน --</option>
              {evaluatees.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <Button 
            onClick={handleAdd} 
            disabled={!selectedEvaluator || !selectedEvaluatee || selectedEvaluator === selectedEvaluatee}
          >
            เพิ่มคู่ประเมิน
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border">
        <table className="w-full text-sm text-left align-middle border-collapse">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">ลำดับ</th>
              <th className="px-6 py-3">ผู้ประเมิน</th>
              <th className="px-6 py-3">ผู้รับการประเมิน</th>
              <th className="px-6 py-3 text-right">ดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length > 0 ? assignments.map((ast, idx) => (
              <tr key={ast.id} className="border-b">
                <td className="px-6 py-4">{idx + 1}</td>
                <td className="px-6 py-4">{ast.evaluatorName}</td>
                <td className="px-6 py-4">{ast.evaluateeName}</td>
                <td className="px-6 py-4 text-right">
                  <Button size="sm" variant="danger" onClick={() => handleDelete(ast.id)}><FaTrash /></Button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="px-6 py-4 text-center">ไม่มีข้อมูลคู่ประเมิน</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
